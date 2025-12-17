import * as SQLite from 'expo-sqlite';
import { Route, UserPreferences, UserStats } from '@/utils';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('route_randomizer.db');
      await this.createTables();
      await this.migrateSchemaIfNeeded();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    try {
      // Super simple tables for personal use
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS routes (
          id TEXT PRIMARY KEY,
          name TEXT,
          distance REAL,
          duration REAL,
          points TEXT,
          start_location TEXT,
          end_location TEXT,
          weather TEXT,
          created_at TEXT,
          walked_at TEXT,
          difficulty TEXT,
          safety_score INTEGER
        );
      `);

      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS preferences (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
    } catch (error) {
      console.error('Error creating database tables:', error);
      throw error;
    }
  }

  // Simple migration - handle schema changes
  private async migrateSchemaIfNeeded(): Promise<void> {
    if (!this.db) return;
    
    try {
      // Check if start_location column exists
      const tableInfo = await this.db.getAllAsync("PRAGMA table_info(routes)");
      const hasStartLocation = tableInfo.some((col: any) => col.name === 'start_location');
      
      if (!hasStartLocation) {
        await this.db.execAsync(`
          ALTER TABLE routes ADD COLUMN start_location TEXT DEFAULT '{"latitude":0,"longitude":0}';
          ALTER TABLE routes ADD COLUMN end_location TEXT DEFAULT '{"latitude":0,"longitude":0}';
        `);
      }
    } catch (error) {
      console.error('Migration failed, recreating tables:', error);
      // If migration fails, drop and recreate tables
      await this.db.execAsync('DROP TABLE IF EXISTS routes');
      await this.createTables();
    }
  }

  // Super simple route operations
  async saveRoute(route: Route): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO routes (id, name, distance, duration, points, start_location, end_location, weather, created_at, walked_at, difficulty, safety_score) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        route.id, route.name, route.distance, route.duration,
        JSON.stringify(route.points), 
        JSON.stringify(route.startLocation),
        JSON.stringify(route.endLocation),
        JSON.stringify(route.weatherConditions),
        route.createdAt.toISOString(), route.walkedAt?.toISOString() || null,
        route.difficulty, route.safetyScore
      ]
    );
  }

  async getAllRoutes(): Promise<Route[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.getAllAsync('SELECT * FROM routes ORDER BY created_at DESC');
      return results.map((row: any) => ({
        id: row.id,
        name: row.name,
        distance: row.distance,
        duration: row.duration,
        points: JSON.parse(row.points || '[]'),
        startLocation: JSON.parse(row.start_location || '{"latitude":0,"longitude":0}'),
        endLocation: JSON.parse(row.end_location || '{"latitude":0,"longitude":0}'),
        weatherConditions: JSON.parse(row.weather || '{}'),
        createdAt: new Date(row.created_at),
        walkedAt: row.walked_at ? new Date(row.walked_at) : undefined,
        difficulty: row.difficulty,
        safetyScore: row.safety_score
      }));
    } catch (error) {
      console.error('Error loading routes:', error);
      return [];
    }
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

  // Super simple preferences - just use key-value store
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    if (!this.db) {
      console.error('Database not initialized');
      return;
    }

    try {
      // Use a transaction to ensure all operations succeed or fail together
      await this.db.withTransactionAsync(async () => {
        // Clear existing preferences
        await this.db!.runAsync('DELETE FROM preferences');
        
        // Insert new preferences as key-value pairs
        const entries = Object.entries(preferences);
        for (const [key, value] of entries) {
          await this.db!.runAsync(
            'INSERT INTO preferences (key, value) VALUES (?, ?)',
            [key, String(value)]
          );
        }
      });
    } catch (error) {
      console.error('Error saving preferences to database:', error);
      throw error;
    }
  }

  async getUserPreferences(): Promise<UserPreferences | null> {
    if (!this.db) {
      console.error('Database not initialized');
      return null;
    }

    try {
      const result = await this.db.getAllAsync('SELECT * FROM preferences');
      
      const prefs: any = {};
      result.forEach((row: any) => {
        prefs[row.key] = row.value;
      });
      
      const finalPrefs = {
        preferredDuration: parseInt(prefs.preferredDuration) || 30,
        avoidHighways: prefs.avoidHighways === 'true',
        preferShadedRoutes: prefs.preferShadedRoutes === 'true',
        preferQuietStreets: prefs.preferQuietStreets === 'true',
        weatherSensitivity: prefs.weatherSensitivity || 'medium',
        units: prefs.units || 'metric',
        temperatureUnits: prefs.temperatureUnits || 'celsius',
        enableWeatherAlerts: prefs.enableWeatherAlerts === 'true',
        enableMorningNotifications: prefs.enableMorningNotifications === 'true',
        morningNotificationTime: parseInt(prefs.morningNotificationTime) || 8,
      };
      
      return finalPrefs;
    } catch (error) {
      console.error('Error getting preferences from database:', error);
      return null;
    }
  }

  // Super simple stats - just basic totals
  async getUserStats(): Promise<UserStats | null> {
    if (!this.db) return null;

    const completedRoutes = await this.db.getAllAsync(
      'SELECT distance, duration, walked_at FROM routes WHERE walked_at IS NOT NULL'
    );

    let totalDistance = 0;
    let totalTime = 0;
    let lastWalkDate: Date | undefined;

    completedRoutes.forEach((route: any) => {
      totalDistance += route.distance || 0;
      totalTime += route.duration || 0;
      
      const walkedAt = new Date(route.walked_at);
      if (!lastWalkDate || walkedAt > lastWalkDate) {
        lastWalkDate = walkedAt;
      }
    });
    
    return {
      totalRoutes: completedRoutes.length,
      totalDistance,
      totalTime,
      currentStreak: this.calculateStreak(completedRoutes),
      lastWalkDate,
    };
  }

  private calculateStreak(completedRoutes: any[]): number {
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

}

export const databaseService = new DatabaseService();