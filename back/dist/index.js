"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const show_1 = __importDefault(require("./routes/show"));
const venue_1 = __importDefault(require("./routes/venue"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/shows', show_1.default);
app.use('/venues', venue_1.default);
app.get('/', (req, res) => {
    res.send('Hello from backend!');
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
