/* eslint-disable @typescript-eslint/no-explicit-any */
import cluster from 'cluster';
import jwt from 'jsonwebtoken';
import os from 'os';
import { Server } from 'socket.io';
import app from './app';
import config from './config';
import { waitForDBConnection } from './db';
import { UnauthorizedError } from './errors/unauthorized.error';
import logger from './utils/logger';


(async () => {
  logger.info('Connecting to Database...');
  await waitForDBConnection();
  logger.info('DB connected');
  // await redisClient.connect();

  const numCPUs = process.env.NODE_ENV === 'production' ? os.cpus().length : 1;
  if (cluster.isPrimary) {
    logger.info(`Master ${process.pid} is running`);

    // Fork workers...
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker) => {
      logger.info(`Worker ${worker.process.pid} died`);
    });
  } else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server
    const normalizePort = (val: any) => {
      const port = parseInt(val, 10);

      if (Number.isNaN(port)) {
        // Named pipe
        return val;
      }

      if (port >= 0) {
        // Port number
        return port;
      }

      return false;
    };

    const port = normalizePort(config.PORT || '4010');

    const onError = (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof port === 'string' ? `pipe ${port}` : `port ${port}`;
      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    };

    app.on('error', onError);
    const onListening = () => {
      const bind = typeof port === 'string' ? `pipe ${port}` : `port ${port}`;
      logger.info(`Listening on ${bind}`);
      logger.info('Connected!');
    };

    const server = app.listen(port, onListening);
    logger.info(`Worker ${process.pid} started`);

    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });


    io.use((socket, next) => {
      const token = socket.handshake.headers.token;

      if (typeof token === 'string') {
        jwt.verify(token, config.JWT_SECRET, (err: any) => {
          if (err) {
            logger.error('Socket authentication failed', err);
          }
          logger.info('Socket authenticated');
          next();
        });
      } else {
        throw new UnauthorizedError();
      }
    });

    io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);
      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });

      socket.on('join chat', (id) => {
        socket.join(id);
        logger.info(`User joined room: ${id}`);
      });

      socket.on('new message', (newMessageReceived) => {
        socket.in('1').emit('message received', newMessageReceived);
        logger.info(`New message received: ${newMessageReceived}`);
        socket.emit(`new message`, newMessageReceived);
      });
    });

  }
}
)();

