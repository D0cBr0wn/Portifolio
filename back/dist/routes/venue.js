"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_client_1 = require("../../generated/prisma_client");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const prisma = new prisma_client_1.PrismaClient();
const venueSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    address1: zod_1.z.string(),
    address2: zod_1.z.string(),
    zipCode: zod_1.z.number(),
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
// PUT update a venue by ID
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
        res.status(400).json({ error: 'Invalid ID' });
    try {
        const data = venueSchema.parse(req.body);
        const updatedVenue = await prisma.venue.update({
            where: { id },
            data
        });
        res.json(updatedVenue);
    }
    catch (err) {
        res.status(400).json({ error: err });
    }
});
// DELETE a venue by ID
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id))
        res.status(400).json({ error: 'Invalid ID' });
    try {
        await prisma.venue.delete({
            where: { id }
        });
        res.status(204).send(); // No content
    }
    catch (err) {
        res.status(400).json({ error: err });
    }
});
exports.default = router;
