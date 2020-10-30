import fastify from 'fastify';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { IncomingMessage } from 'http';

dotenv.config();

type RequestBody = {
    title: string | undefined,
    body: string | undefined,
    url: string | undefined
};

const getDeviceID = async () => {
    const deviceName = process.env.PUSHBULLET_DIST_DEVICE_NAME;
    const res = await fetch('https://api.pushbullet.com/v2/devices', {
        method: 'GET',
        headers: {
            'Access-Token': process.env.PUSHBULLET_ACCESS_TOKEN || ''
        }
    });
    const resJson = await res.json();
    const deviveId: string = resJson.devices.find((d: any) => d.nickname === deviceName).iden || '';
    return deviveId;
};
const postData = async (body: RequestBody) => {
    const deviceId = await getDeviceID();
    const sendData = body as any;
    sendData['type'] = body.url ? 'link' : 'note';
    sendData['device_iden'] = deviceId;
    const res = await fetch('https://api.pushbullet.com/v2/pushes', {
        method: 'POST',
        headers: {
            'Access-Token': process.env.PUSHBULLET_ACCESS_TOKEN || '',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sendData)
    });
    return res.ok;
};
const server = fastify({
    rewriteUrl: (req: IncomingMessage): string => {
        return '/';
    }
});

server.get('/', async (request, reply) => {
    return 'OK';
});

server.post('/', async (request, reply) => {
    const body: RequestBody = request.body as RequestBody;
    if (!body) {
        return reply.code(400).send();
    }
    postData(body);
    return reply.code(200).send();
});

server.listen(3000, '0.0.0.0', (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    console.log(`Server listening at ${address}`);
});