import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(_client: any) {
    console.log('Client connected to WebSockets');
  }

  handleDisconnect(_client: any) {
    console.log('Client disconnected from WebSockets');
  }

  private broadcast(event: string, payload?: any) {
    if (this.server && this.server.clients) {
      const message = JSON.stringify({ event, payload });
      this.server.clients.forEach((client: any) => {
        // Only send if the connection is open
        if (client.readyState === 1) { // 1 = OPEN in ws
          client.send(message);
        }
      });
    }
  }

  broadcastJobStatusChanged() {
    this.broadcast('job-status-changed');
  }

  broadcastWorkerHeartbeat() {
    this.broadcast('worker-heartbeat');
  }

  broadcastStatsUpdate() {
    this.broadcast('stats-update');
  }

  broadcastJobFailed(jobId: string, error: string, type: string) {
    this.broadcast('job-failed', { jobId, error, type });
  }
}
