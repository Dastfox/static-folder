let ws = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 999;
const reconnectDelay = 3000; // 3 seconds

function connectWebSocket() {
    ws = new WebSocket("ws://" + window.location.host + "/ws/home");

    ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts = 0;
        initializeJournalButtonState().then(() => {});
    };

    ws.onmessage = (event) => {
        const is_object = event.data.startsWith("{");
        console.log(event.data, typeof event.data);
        if (window.location.pathname !== event.data && !is_object) {
            window.location.href = event.data;
        }
        // if it does, parse it
        if (is_object) {
            const data = JSON.parse(event.data);
            console.log("Received object", data, data.type, data.show_journal_button);

            if (data.type === 'journal_state') {
                const journalButton = document.getElementById('journal-button');
                journalButton.style.display = data.show_journal_button ? 'block' : 'none';
            } else if (data.type === "background") {
                if (data.path) {
                    document.body.style.backgroundImage = `url('/static/${data.path}')`;
                } else {
                    document.body.style.backgroundImage = 'none';
                }
            }
        }

    };

    async function initializeJournalButtonState() {
        try {
            const response = await fetch('/get-journal-button-state');
            const data = await response.json();
            const journalButton = document.getElementById('journal-button');
            if (journalButton) {
                journalButton.style.display = data.show_journal_button ? 'block' : 'none';
            }
        } catch (error) {
            console.error('Error fetching initial journal button state:', error);
        }
    }

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateConnectionStatus(false);
        ws = null;

        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
            setTimeout(connectWebSocket, reconnectDelay);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
    };
}

// Initial connection
connectWebSocket();

// Cleanup on page unload
window.onbeforeunload = () => {
    if (ws) {
        ws.close();
    }
};