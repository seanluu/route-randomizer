import * as SQLite from 'expo-sqlite';
import { Route, UserPreferences, UserStats } from '@/utils';

class DatabaseService {
  // Database connection, start as null until initialized
  private db: SQLite.SQLiteDatabase | null = null;

  // Initialize database and create tables
  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('route_randomizer.db');
    await this.createTables();
  }

  // Create all database tables
  private async createTables(): Promise<void> {
    if (!this.db) return;

    // for my own reference:
    // PRIMARY KEY = unique identifier
    // NOT NULL = required field
    // DEFAULT = fallback value
    // TEXT = strings, data, JSON
    // INTEGER = whole numbers, booleans
    // REAL = decimal numbers

    try {
      // Create routes table to store all generated routes
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS routes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          distance REAL NOT NULL,
          duration REAL NOT NULL,
          points TEXT NOT NULL,
          start_latitude REAL NOT NULL, 
          end_latitude REAL NOT NULL,
          weather_conditions TEXT NOT NULL,
          created_at TEXT NOT NULL,
          walked_at TEXT,
          is_loop INTEGER NOT NULL,
          difficulty TEXT NOT NULL,
          safety_score INTEGER NOT NULL,
          weather_notes TEXT NOT NULL
        );
      `);

      // Create user preferences table to store user settings
      await this.db.execAsync('DROP TABLE IF EXISTS user_preferences');
      await this.db.execAsync(`
        CREATE TABLE user_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          preferred_distance REAL NOT NULL,
          avoid_highways INTEGER NOT NULL,
          prefer_shaded_routes INTEGER NOT NULL,
          prefer_quiet_routes INTEGER NOT NULL,
          weather_sensitivity TEXT NOT NULL,
          units TEXT NOT NULL,
          temperature_units TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // Create user stats table for walking stats
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          total_routes INTEGER NOT NULL DEFAULT 0,
          total_distance REAL NOT NULL DEFAULT 0,
          total_time REAL NOT NULL DEFAULT 0,
          current_streak INTEGER NOT NULL DEFAULT 0,
          longest_streak INTEGER NOT NULL DEFAULT 0,
          unique_routes INTEGER NOT NULL DEFAULT 0,
          last_walk_data TEXT,
          updated_at TEXT NOT NULL
        );
      `);

      // Set up default data for new users
      await this.initializeDefaultPreferences();
      await this.initializeDefaultStats();

    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // Set up default user preferences for new users
  private async initializeDefaultPreferences(): Promise<void> {
    const preferences = await this.getUserPreferences();
    if (!preferences) {
      const defaultPreferences: UserPreferences = {
      preferredDuration: 30,
      avoidHighways: true,
      preferShadedRoutes: true,
      preferQuietStreets: true,
      weatherSensitivity: 'moderate',
      units: 'imperial', // default to miles
      temperatureUnits: 'fahrenheit',
      };  
      await this.saveUserPreferences(defaultPreferences);
    }
  }

  // Set up default user stats for new users
  private async initializeDefaultStats(): Promise<void> {
    const stats = await this.getUserStats();
    if (!stats) {
      const defaultStats: UserStats = {
      totalRoutes: 0,
      totalDistance: 0,
      totalTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      uniqueRoutes: 0,
      // Start time-based stats at 0 or new users
      todayRoutes: 0,
      todayDistance: 0,
      todayTime: 0,
      thisWeekRoutes: 0,
      thisWeekDistance: 0,
      thisWeekTime: 0,
      thisMonthRoutes: 0,
      thisMonthDistance: 0,
      thisMonthTime: 0,
      thisYearRoutes: 0,
      thisYearDistance: 0,
      thisYearTime: 0,
      };
      await this.saveUserStats(defaultStats);
    }
  }

  // Save a route to the database

  async saveRoute(route: Route): Promise<void> {
    if (!this.db) return;
    
    // Convert complex objs to JSON strings for database storage
    const pointsJson = JSON.stringify(route.points);
    const weatherJson = JSON.stringify(route.weatherConditions);
    const weatherNotesJson = JSON.stringify(route.weatherNotes);

    // Prepare the route data for database insertion
    const routeData = [
      route.id,
      route.name,
      route.distance,
      route.duration,
      pointsJson,
      route.startLocation.latitude,
      route.startLocation.longitude,
      route.endLocation.latitude,
      route.endLocation.longitude,
      weatherJson,
      route.createdAt.toISOString(),
      route.walkedAt?.toISOString() || null,
      route.isLoop ? 1 : 0,
      route.difficulty,
      route.safetyScore,
      weatherNotesJson,
    ];

    // ? in SQL is different than in TypeScript since it's required/placeholder values instead of optional
    await this.db.runAsync(
      `INSERT OR REPLACE INTO routes (
      id, name, distance, duration, points, start_latitude, start_longitude,
      end_latitude, end_longitude, weather_conditions, created_at, walked_at,
      is_loop, difficulty, safety_score, weather_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      routeData
    );
  }

  // // Get a specific route by its ID
  // async getRoute(id: string): Promise<Route | null> {
  //   if (!this.db) return null;

  //   const result = await this.db.getFirstAsync(
  //     'SELECT * FROM routes WHERE id = ?',
  //     [id]
  //   );

  //   if (result) {
  //     return this.convertRowToRoute(result as any);
  //   }
  //   return null;
  // }

  // Get all routes ordered by the most recent first

  async getAllRoutes(): Promise<Route[]> {
    if (!this.db) return [];

    const results = await this.db.getAllAsync(
      'SELECT * FROM routes ORDER BY created_at DESC'
    );

    return results.map((row: any) => this.convertRowToRoute(row));
  }

  // Marking a route as walked/completed
  async markRouteAsWalked(routeId: string): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      'UPDATE routes SET walked_at = ? WHERE id = ?',
      [new Date().toISOString(), routeId]
    );
  }

  // Deleting a route from database

    // Marking a route as walked/completed
  async deleteRoute(routeId: string): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      'DELETE FROM routes WHERE id = ?',
      [routeId]
    );
  }

  // Helper to convert DB row to a route object
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
      isLoop: row.is_loop === 1,
      difficulty: row.difficulty as 'easy' | 'moderate' | 'hard',
      safetyScore: row.safety_score,
      weatherNotes: JSON.parse(row.weather_notes),
    };
  }

  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO user_preferences (
      id, preferred_duration, avoid_highways, prefer_shaded_routes,
      prefer_quiet_streets, weather_sensitivity, units, temperature_units, updated_at
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        preferences.preferredDuration,
        preferences.avoidHighways ? 1 : 0,
        preferences.preferShadedRoutes ? 1 : 0,
        preferences.preferQuietStreets ? 1 : 0,
        preferences.weatherSensitivity,
        preferences.units || 'metric',
        preferences.temperatureUnits || 'celsius',
        new Date().toISOString()
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
        preferredDuration: row.preferred_duration,
        avoidHighways: row.avoid_highways === 1,
        preferShadedRoutes: row.prefer_shaded_routes === 1,
        preferQuietStreets: row.prefer_quiet_streets === 1,
        weatherSensitivity: row.weather_sensitivity as 'low' | 'moderate' | 'high',
        units: row.units as 'metric' | 'imperial' | undefined,
        temperatureUnits: row.temperature_units as 'celsius' | 'fahrenheit' | undefined,
      };
    }

    return null;
  }

  async saveUserStats(stats: UserStats): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO user_stats (
      id, total_routes, total_distance, total_time, current_streak,
      longest_streak, unique_routes, last_walk_date, updated_at
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        stats.totalRoutes,
        stats.totalDistance,
        stats.totalTime,
        stats.currentStreak,
        stats.longestStreak,
        stats.uniqueRoutes,
        stats.lastWalkDate?.toISOString() || null,
        new Date().toISOString()
      ]
    );
  }

  async getUserStats(): Promise<UserStats | null> {
    if (!this.db) return null;

    const timeBasedStats = await this.calculateTimeBasedStats();
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

    const currentStreak = this.calculateCurrentStreak(completedRoutes);

    return {
      totalRoutes: completedRoutes.length,
      totalDistance,
      totalTime,
      currentStreak,
      longestStreak: currentStreak,
      uniqueRoutes: 0,
      lastWalkDate,
      ...timeBasedStats,
    };
  }

  // Calculate the current walking streak

  private calculateCurrentStreak(completedRoutes: any[]): number {
    if (completedRoutes.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    // Count the consecutive days w/ walks

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

  // Calculate the time-based statistics based on today, weekly, monthly, yearly

  private async calculateTimeBasedStats(): Promise<{
    todayRoutes: number;
    todayDistance: number;
    todayTime: number;
    thisWeekRoutes: number;
    thisWeekDistance: number;
    thisWeekTime: number;
    thisMonthRoutes: number;
    thisMonthDistance: number;
    thisMonthTime: number;
    thisYearRoutes: number;
    thisYearDistance: number;
    thisYearTime: number;
  }> {

    if (!this.db) {
      return this.getEmptyTimeStats();
    }

    // Time ranges for calculations
    const timeRanges = this.getTimeRanges();

    // Completed routes when walked_at isn't null
    const routes = await this.db.getAllAsync(
      'SELECT distance, duration, walked_at FROM routes WHERE walked_at IS NOT NULL'
    );

    // Caluclate stats for each time period (today, weekly, monthly, yearly)
    return this.aggregateStatsByTimeRanges(routes, timeRanges);
  }

  // Empty stats if there's no connection to database
  private getEmptyTimeStats() {
    return {
      todayRoutes: 0,
      todayDistance: 0,
      todayTime: 0,
      thisWeekRoutes: 0,
      thisWeekDistance: 0,
      thisWeekTime: 0,
      thisMonthRoutes: 0,
      thisMonthDistance: 0,
      thisMonthTime: 0,
      thisYearRoutes: 0,
      thisYearDistance: 0,
      thisYearTime: 0,
    };
  }

  // Calculate time ranges for stats for each time period

  private getTimeRanges() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    
    return {
      today, weekStart, monthStart, yearStart
    };
  }

  // Calculate stats for each time period based on route data
  private aggregateStatsByTimeRanges(routes: any[], timeRanges: any) {
    const stats = this.getEmptyTimeStats();

    // Process every completed route
    for (const route of routes) {
      const routeData = route as any;
      const walkedAt = new Date(routeData.walked_at);
      const distance = routeData.distance || 0;
      const duration = routeData.duration || 0;

      // Add completed route stats to each corresponding time period
      this.updateStatsForRoute(stats, walkedAt, distance, duration, timeRanges);
    }
    return stats;
  }

  // Add a route's stats to their corresponding time periods
  private updateStatsForRoute(stats: any, walkedAt: Date, distance: number, duration: number, timeRanges: any) {
    const { today, weekStart, monthStart, yearStart } = timeRanges;

    // Add to today's stats if we walked today
    if (walkedAt >= today) {
      stats.todayRoutes++;
      stats.todayDistance += distance;
      stats.todayTime += duration;
    }

    // Add to this week's stats if we walked this week
    if (walkedAt >= weekStart) {
      stats.thisWeekRoutes++;
      stats.thisWeekDistance += distance;
      stats.thisWeekTime += duration;
    }

    // Add to this month's stats if we walked this month
    if (walkedAt >= monthStart) {
      stats.thisMonthRoutes++;
      stats.thisMonthDistance += distance;
      stats.thisMonthTime += duration;
    }

    // Add to this year's stats if we walked this year duhhhh
    if (walkedAt >= yearStart) {
      stats.thisYearRoutes++;
      stats.thisYearDistance += distance;
      stats.thisYearTime += duration;
    }
  }

}

export const databaseService = new DatabaseService();