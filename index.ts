import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

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
const postData = async () => {
    const deviceId = await getDeviceID();
    const res = await fetch('https://api.pushbullet.com/v2/pushes', {
        method: 'POST',
        headers: {
            'Access-Token': process.env.PUSHBULLET_ACCESS_TOKEN || '',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: 'http://example.com',
            type: 'link',
            device_iden: deviceId
        })
    });
    const resJson = await res.json();
};
postData();