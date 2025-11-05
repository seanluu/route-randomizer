import { databaseService } from '@/services/DatabaseService';
import * as SQLite from 'expo-sqlite';

describe('DatabaseService', () => {
  it('calls UPDATE when marking a route as walked', async () => {
    const runAsync = jest.fn();
    const execAsync = jest.fn();
    const getAllAsync = jest.fn();
    const withTransactionAsync = jest.fn(async (cb: any) => cb());
    const mockDb: any = { runAsync, execAsync, getAllAsync, withTransactionAsync };

    const openSpy = jest.spyOn(SQLite, 'openDatabaseAsync' as any).mockResolvedValue(mockDb);

    await databaseService.init();
    await databaseService.markRouteAsWalked('route_123');

    expect(runAsync).toHaveBeenCalled();
    openSpy.mockRestore();
  });
});


