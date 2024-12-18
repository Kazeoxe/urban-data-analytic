import { NextApiRequest, NextApiResponse } from 'next';
import EarthquakeSocketHandler from '@/pages/api/EarthquakeSocketHandler';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    EarthquakeSocketHandler(req, res);
}
