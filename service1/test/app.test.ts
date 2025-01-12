import request from 'supertest';
import app from '../app';
import * as utils from '../utils';
import { exec } from 'child_process';

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('Service 1 tests.', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Mock sleep to avoid real 2-second delay
    jest.spyOn(utils, 'sleep').mockResolvedValue(undefined); // Skips the 2s delay in tests
    // Mock methods that uses OS specific commands to get information
    // with real like data.
    jest.spyOn(utils, 'getAvailableDiscSpace').mockResolvedValue({
      Filesystem: 'overlay',
      Size: '1006.9G',
      Used: '6.6G',
      Available: '949.0G',
      'Use%': '1%',
      Mounted: '/',
    });

    jest.spyOn(utils, 'getRunningProcesses').mockResolvedValue([
      { COMMAND: 'npm start', PID: '1', TTY: '?', STAT: 'Ssl', TIME: '0:04' },
      { COMMAND: 'node dist/index', PID: '18', TTY: '?', STAT: 'Sl', TIME: '0:02' },
      { COMMAND: 'ps -ax', PID: '29', TTY: '?', STAT: 'R', TIME: '0:00' },
    ]);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        diskSpace: {
          Filesystem: 'overlay',
          Size: '1006.9G',
          Used: '6.6G',
          Available: '949.0G',
          'Use%': '1%',
          Mounted: '/',
        },
        ipAddresses: { eth0: ['172.18.0.2'] },
        osUptime: 15205.936164617538,
        processes: [
          { COMMAND: '/usr/local/bin/python3.12 /usr/local/bin/gunicorn --bind 0.0.0.0:5000 app:app', PID: '1', STAT: 'Ss', TIME: '0:03', TTY: '?' },
          { COMMAND: '/usr/local/bin/python3.12 /usr/local/bin/gunicorn --bind 0.0.0.0:5000 app:app', PID: '7', STAT: 'S', TIME: '0:03', TTY: '?' },
          { COMMAND: 'ps -ax', PID: '8', STAT: 'R', TIME: '0:00', TTY: '?' },
        ],
        serviceUptime: 12.313477993011475,
      }),
    });
  });

  it('should return service information as JSON', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("service1");
    expect(response.body).toHaveProperty("service2");
    expect(response.body.service1).toHaveProperty("diskSpace");
    expect(response.body.service1).toHaveProperty("ipAddresses");
    expect(response.body.service1).toHaveProperty("osUptime");
    expect(response.body.service1).toHaveProperty("processes");
    expect(response.body.service1).toHaveProperty("serviceUptime");
    expect(response.body.service2).toHaveProperty("diskSpace");
    expect(response.body.service2).toHaveProperty("ipAddresses");
    expect(response.body.service2).toHaveProperty("osUptime");
    expect(response.body.service2).toHaveProperty("processes");
    expect(response.body.service2).toHaveProperty("serviceUptime");
  });

  it('should return service information as plain text', async () => {
    const response = await request(app).get('/').set('Content-Type', 'text/plain');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    const responseBody = JSON.parse(response.text);
    expect(responseBody).toHaveProperty("service1");
    expect(responseBody).toHaveProperty("service2");
    expect(responseBody.service1).toHaveProperty("diskSpace");
    expect(responseBody.service1).toHaveProperty("ipAddresses");
    expect(responseBody.service1).toHaveProperty("osUptime");
    expect(responseBody.service1).toHaveProperty("processes");
    expect(responseBody.service1).toHaveProperty("serviceUptime");
    expect(responseBody.service2).toHaveProperty("diskSpace");
    expect(responseBody.service2).toHaveProperty("ipAddresses");
    expect(responseBody.service2).toHaveProperty("osUptime");
    expect(responseBody.service2).toHaveProperty("processes");
    expect(responseBody.service2).toHaveProperty("serviceUptime");
  });

  it('should handle errors when fetching service information', async () => {
    jest.spyOn(utils, 'getAvailableDiscSpace').mockRejectedValue(new Error('Failed to get disk space'));
    const response = await request(app).get('/');
    expect(response.status).toBe(500);
    expect(response.text).toBe('Failed to fetch data from services.');
  });


  it('should stop containers on /stop endpoint', async () => {
    const mockExec = (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
      callback(null, 'Stopped containers', '');
    });

    const response = await request(app).post('/stop');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Stopping containers. See from the terminal more information.');
    expect(mockExec).toHaveBeenCalledWith(
      "docker stop $(docker ps --filter 'name=compse140-project' -q)",
      expect.any(Function)
    );
  });

  it('should handle errors when stopping containers', async () => {
    const mockExec = (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
      callback(new Error('Failed to stop containers'), '', 'Error stopping containers');
    });

    const response = await request(app).post('/stop');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Stopping containers. See from the terminal more information.');
    expect(mockExec).toHaveBeenCalledWith(
      "docker stop $(docker ps --filter 'name=compse140-project' -q)",
      expect.any(Function)
    );
  });

  it("should wait 2 s between can respond to another request", async () => {
    jest.spyOn(utils, 'sleep').mockRestore();
    const firstRequest = await request(app).get('/');
    expect(firstRequest.status).toBe(200);
    const secondRequestPromise = request(app).get('/').timeout(1000);
    await expect(secondRequestPromise).rejects.toThrow('Timeout of 1000ms exceeded');
    await utils.sleep(1000);
    const thirdRequest = await request(app).get('/');
    expect(thirdRequest.status).toBe(200);
  });
});