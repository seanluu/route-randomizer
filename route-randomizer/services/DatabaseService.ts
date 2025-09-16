import * as SQLite from 'expo-sqlite';
import { Route, UserPreferences, UserStats } from '@/utils';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('route_randomizer.db');
    await this.createTables();
    await this.migrateSchemaIfNeeded();
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    try {
      // Simple routes table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS routes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          distance REAL NOT NULL,
          duration REAL NOT NULL,
          points TEXT NOT NULL,
          start_latitude REAL NOT NULL,
          start_longitude REAL NOT NULL,
          end_latitude REAL NOT NULL,
          end_longitude REAL NOT NULL,
          weather_conditions TEXT NOT NULL,
          created_at TEXT NOT NULL,
          walked_at TEXT,
          difficulty TEXT NOT NULL,
          safety_score INTEGER NOT NULL
        );
      `);

      // Simple preferences table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id INTEGER PRIMARY KEY DEFAULT 1,
          units TEXT DEFAULT 'metric',
          temperature_units TEXT DEFAULT 'celsius',
          updated_at TEXT NOT NULL
        );
      `);

      // Initialize default preferences
      await this.initializeDefaultPreferences();
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // Drop unused columns (is_loop, weather_notes) if they exist
  private async migrateSchemaIfNeeded(): Promise<void> {
    if (!this.db) return;
    try {
      const info = await this.db.getAllAsync(`PRAGMA table_info(routes)`);
      const columns = (info as any[]).map(c => c.name as string);
      const hasIsLoop = columns.includes('is_loop');
      const hasWeatherNotes = columns.includes('weather_notes');
      if (!hasIsLoop && !hasWeatherNotes) return;

      await this.db.execAsync('BEGIN TRANSACTION');
      // Create new table without unused columns
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS routes_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          distance REAL NOT NULL,
          duration REAL NOT NULL,
          points TEXT NOT NULL,
          start_latitude REAL NOT NULL,
          start_longitude REAL NOT NULL,
          end_latitude REAL NOT NULL,
          end_longitude REAL NOT NULL,
          weather_conditions TEXT NOT NULL,
          created_at TEXT NOT NULL,
          walked_at TEXT,
          difficulty TEXT NOT NULL,
          safety_score INTEGER NOT NULL
        );
      `);

      // Copy data across selecting only the kept columns
      await this.db.execAsync(`
        INSERT INTO routes_new (
          id, name, distance, duration, points, start_latitude, start_longitude,
          end_latitude, end_longitude, weather_conditions, created_at, walked_at,
          difficulty, safety_score
        )
        SELECT 
          id, name, distance, duration, points, start_latitude, start_longitude,
          end_latitude, end_longitude, weather_conditions, created_at, walked_at,
          difficulty, safety_score
        FROM routes;
      `);

      await this.db.execAsync('DROP TABLE routes');
      await this.db.execAsync('ALTER TABLE routes_new RENAME TO routes');
      await this.db.execAsync('COMMIT');
    } catch (error) {
      await this.db!.execAsync('ROLLBACK');
      console.error('Schema migration failed:', error);
    }
  }

  private async initializeDefaultPreferences(): Promise<void> {
    const preferences = await this.getUserPreferences();
    if (preferences) return; // Already have preferences
    
    const defaultPreferences: UserPreferences = {
      preferredDuration: 30,
      avoidHighways: true,
      preferShadedRoutes: true,
      preferQuietStreets: true,
      weatherSensitivity: 'medium',
      units: 'metric',
      temperatureUnits: 'celsius',
    };
    await this.saveUserPreferences(defaultPreferences);
  }

  // Basic route operations
  async saveRoute(route: Route): Promise<void> {
    if (!this.db) return;

    const pointsJson = JSON.stringify(route.points);
    const weatherJson = JSON.stringify(route.weatherConditions);

    await this.db.runAsync(
      `INSERT OR REPLACE INTO routes (
        id, name, distance, duration, points, start_latitude, start_longitude,
        end_latitude, end_longitude, weather_conditions, created_at, walked_at,
        difficulty, safety_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        route.id, route.name, route.distance, route.duration, pointsJson,
        route.startLocation.latitude, route.startLocation.longitude,
        route.endLocation.latitude, route.endLocation.longitude,
        weatherJson, route.createdAt.toISOString(),
        route.walkedAt?.toISOString() || null,
        route.difficulty, route.safetyScore,
      ]
    );
  }

  async getAllRoutes(): Promise<Route[]> {
    if (!this.db) return [];

    const results = await this.db.getAllAsync(
      'SELECT * FROM routes ORDER BY created_at DESC'
    );

    return results.map((row: any) => this.convertRowToRoute(row));
  }

  async markRouteAsWalked(routeId: string): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync(
      'UPDATE routes SET walked_at = ? WHERE id = ?',
      [new Date().toISOString(), routeId]
    );
  }

  async deleteRoute(routeId: string): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM routes WHERE id = ?', [routeId]);
  }

  // Basic preferences operations
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO user_preferences (
        id, units, temperature_units, updated_at
      ) VALUES (1, ?, ?, ?)`,
      [
        preferences.units || 'metric',
        preferences.temperatureUnits || 'celsius',
        new Date().toISOString(),
      ]
    );
  }

  async getUserPreferences(): Promise<UserPreferences | null> {
    if (!this.db) return null;

    const result = await this.db.getFirstAsync(
      'SELECT * FROM user_preferences WHERE id = 1'
    );

    if (result) {
      const row = result as any;
      return {
        preferredDuration: 30, // Default
        avoidHighways: true,   // Default
        preferShadedRoutes: true, // Default
        preferQuietStreets: true, // Default
        weatherSensitivity: 'moderate', // Default
        units: row.units as 'metric' | 'imperial' | undefined,
        temperatureUnits: row.temperature_units as 'celsius' | 'fahrenheit' | undefined,
      };
    }

    return null;
  }

  // Simple stats - just basic totals from completed routes
  async getUserStats(): Promise<UserStats | null> {
    if (!this.db) return null;

    try {
      const completedRoutes = await this.db.getAllAsync(
        'SELECT distance, duration, walked_at FROM routes WHERE walked_at IS NOT NULL ORDER BY walked_at DESC'
      );
      
      let totalDistance = 0;
      let totalTime = 0;
      let lastWalkDate: Date | undefined;
      
      for (const route of completedRoutes) {
        const routeData = route as any;
        totalDistance += routeData.distance || 0;
        totalTime += routeData.duration || 0;
        
        const walkedAt = new Date(routeData.walked_at);
        if (!lastWalkDate || walkedAt > lastWalkDate) {
          lastWalkDate = walkedAt;
        }
      }
      
      const currentStreak = this.calculateSimpleStreak(completedRoutes);
      
      return {
        totalRoutes: completedRoutes.length,
        totalDistance,
        totalTime,
        currentStreak,
        lastWalkDate,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  // Simple streak calculation - just count consecutive days with walks
  private calculateSimpleStreak(completedRoutes: any[]): number {
    if (completedRoutes.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    // Count consecutive days with walks
    for (const route of completedRoutes) {
      const walkDate = new Date(route.walked_at);
      walkDate.setHours(0, 0, 0, 0);
      
      if (walkDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (walkDate.getTime() < currentDate.getTime()) {
        break;
      }
    }
    
    return streak;
  }

  // Helper function to convert database row to Route object
  private convertRowToRoute(row: any): Route {
    return {
      id: row.id,
      name: row.name,
      distance: row.distance,
      duration: row.duration,
      points: JSON.parse(row.points),
      startLocation: {
        latitude: row.start_latitude,
        longitude: row.start_longitude,
      },
      endLocation: {
        latitude: row.end_latitude,
        longitude: row.end_longitude,
      },
      weatherConditions: JSON.parse(row.weather_conditions),
      createdAt: new Date(row.created_at),
      walkedAt: row.walked_at ? new Date(row.walked_at) : undefined,
      difficulty: (row.difficulty as 'easy' | 'moderate' | 'hard') || 'easy',
      safetyScore: (row.safety_score as number) ?? 80,
    };
  }
}

export const databaseService = new DatabaseService();