"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_client_1 = require("../../generated/prisma_client");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const prisma = new prisma_client_1.PrismaClient();
const venueSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1)
});
// GET all venues
router.get('/', async (req, res) => {
    const venues = await prisma.venue.findMany();
    res.json(venues);
});
// POST a new venue
router.post('/', async (req, res) => {
    try {
        const data = venueSchema.parse(req.body);
        const venue = await prisma.venue.create({ data });
        res.status(201).json(venue);
    }
    catch (err) {
        res.status(400).json({ error: err });
    }
});
exports.default = router;
