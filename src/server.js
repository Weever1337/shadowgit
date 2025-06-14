import express from 'express';
import bodyParser from 'body-parser';
import {webhookHandler} from './github/webhookHandler.js';
import connectDB from './services/db.js';
import {launchBot} from './bot/index.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.post('/webhook', webhookHandler);

const startServer = async () => {
    await connectDB();
    launchBot();
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server running on port ${process.env.PORT || 3000}`);
    });
};

startServer();