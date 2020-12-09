import fastify from 'fastify';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import loggerHouse from 'logger-house';
import fastifyMultipart from 'fastify-multipart';
import FormData from 'form-data';
import FileType from 'file-type';
import { IncomingMessage } from 'http';

dotenv.config();
loggerHouse.configure(null);

type RequestBody = {
    title?: string | undefined,
    body?: string | undefined,
    url?: string | undefined,
    filename?: string | undefined
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
    sendData['type'] = body.filename ? 'file' : body.url ? 'link' : 'note';
    sendData['device_iden'] = deviceId;
    if (body.filename) {
        sendData['file_name'] = body.filename;
        sendData['file_type'] = 'image/jpeg';
        sendData['file_url'] = body.url;
        delete sendData['url'];
    }
    const res = await fetch('https://api.pushbullet.com/v2/pushes', {
        method: 'POST',
        headers: {
            'Access-Token': process.env.PUSHBULLET_ACCESS_TOKEN || '',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sendData)
    });
    if (res.ok) {
        loggerHouse.info(`postData type:${body.filename ? 'file' : body.url ? 'link' : 'note'} dist:${deviceId} title:${body.title} body:${body.body} url:${body.url}`);
    }
    return res.ok;
};
const postFile = async (file: Buffer, filename: string, mime: string) => {
    const uploadRequestRes = await fetch('https://api.pushbullet.com/v2/upload-request', {
        method: 'POST',
        headers: {
            'Access-Token': process.env.PUSHBULLET_ACCESS_TOKEN || '',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            file_name: filename,
            file_type: mime
        })
    });
    const uploadRequestResJson = await uploadRequestRes.json();
    const uploadUrl = uploadRequestResJson.upload_url;
    const fileUrl = uploadRequestResJson.file_url;
    const form = new FormData();
    form.append('file', file);
    const uploadFileRes = await fetch(uploadUrl, {
        method: 'POST',
        body: form
    });
    const postBody: RequestBody = {
        filename: filename,
        url: fileUrl
    };
    await postData(postBody);
};

const server = fastify({
    rewriteUrl: (req: IncomingMessage): string => {
        const { url } = req;
        if (!url) {
            return '/';
        } else if (/^.*\/file$/.test(url)) {
            return '/file';
        } else {
            return '/';
        }
    }
});

server.register(fastifyMultipart);

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

server.post('/file', async (request, reply) => {
    const data = await request.file();
    const fileBuffer = await data.toBuffer();
    const type = await FileType.fromBuffer(fileBuffer);
    loggerHouse.info(`postFile filename:${data.filename} type:${type?.mime}`);
    await postFile(fileBuffer, data.filename, type?.mime || 'plain/text');
    return reply.send();
});

server.listen(process.env.PORT || 3000, '0.0.0.0', (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    loggerHouse.log(`Server listening at ${address}`);
});