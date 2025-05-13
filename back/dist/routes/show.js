"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_client_1 = require("../../generated/prisma_client");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const prisma = new prisma_client_1.PrismaClient();
const showSchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    date: zod_1.z
        .string()
        .refine(d => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
    venueId: zod_1.z.number()
});
// GET all shows
router.get('/', async (req, res) => {
    const shows = await prisma.show.findMany({ include: { venue: true } });
    res.json(shows);
});
// POST a new show
router.post('/', async (req, res) => {
    try {
        const data = showSchema.parse(req.body);
        const show = await prisma.show.create({
            data: {
                label: data.label,
                date: new Date(data.date),
                venueId: data.venueId
            }
        });
        res.status(201).json(show);
    }
    catch (err) {
        res.status(400).json({ error: err });
    }
});
exports.default = router;
