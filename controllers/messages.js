const Message = require('../models/Message');

exports.createMessage = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Please provide name, email and message' });
        }

        const createdMessage = await Message.create({ name, email, message });
        res.status(201).json({ success: true, data: createdMessage });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find().sort('-createdAt');
        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        await Message.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
