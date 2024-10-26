const userjoinedController = (req, res) => {
    const { webhookUrl, message } = req.body;

    if (!webhookUrl || !message) {
        return res.status(400).json({ error: 'Missing webhook URL or message' });
    }

 
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: message,  
        })
    })
    .then(response => response.json())
    .then(json => {
        console.log('Webhook response:', json);
        res.status(200).json({ message: 'Notification sent successfully' });
    })
    .catch(err => {
        console.error('Error sending webhook:', err);
        res.status(500).json({ error: 'Failed to send webhook' });
    });
};



module.exports = {
    userjoinedController
}