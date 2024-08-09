import express from 'express';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { syncDatabase } from './models/index.js';
import config from './config/config.js';

const app = express();
app.use(express.json());
app.use('/api/v1/', routes);

app.use(notFoundHandler);
app.use(errorHandler);


syncDatabase().then(() => {
    app.listen(config.port, () => {
        console.log(`Server is running on http://localhost:${config.port}`);
    });
}).catch((err) => {
    console.error('Unable to connect to the database:', err);
});
