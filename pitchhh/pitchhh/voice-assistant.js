// voice-assistant.js

let recognition; // For SpeechRecognition
let utterance; // For SpeechSynthesisUtterance

// Check for Web Speech API browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesis = window.speechSynthesis;

const aliAiAssistantBar = document.getElementById('ali-ai-assistant-bar');
const statusText = aliAiAssistantBar ? aliAiAssistantBar.querySelector('.status-text') : null;
const transcriptionDisplay = document.getElementById('transcription-display');

let isListening = false;
let isSpeaking = false; // Flag to track if Ali is currently speaking

// --- Speech Synthesis (Text-to-Speech) Function ---
window.speak = function(message) {
    if (!SpeechSynthesis) {
        console.error("Speech Synthesis API not supported in this browser.");
        return;
    }

    if (isSpeaking) {
        SpeechSynthesis.cancel(); // Stop current speech if any
    }

    utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US'; // Set language to English (United States)
    utterance.volume = 1;     // Range 0 to 1
    utterance.rate = 1;       // Range 0.1 to 10
    utterance.pitch = 1;      // Range 0 to 2

    utterance.onstart = () => {
        console.log("Ali is speaking: " + message);
        isSpeaking = true;
        if (aliAiAssistantBar) {
            aliAiAssistantBar.classList.add('speaking');
            if (statusText) statusText.textContent = 'Speaking...';
        }
    };

    utterance.onend = () => {
        console.log("Ali finished speaking.");
        isSpeaking = false;
        if (aliAiAssistantBar) {
            aliAiAssistantBar.classList.remove('speaking');
            if (statusText) statusText.textContent = 'Tap to speak';
        }
        // If recognition was started before speaking, resume it (optional, based on desired UX)
        // If you want Ali to listen immediately after speaking, uncomment this:
        // if (recognition && !isListening) {
        //     recognition.start();
        // }
    };

    utterance.onerror = (event) => {
        console.error("Speech Synthesis Error: ", event.error);
        isSpeaking = false;
        if (aliAiAssistantBar) {
            aliAiAssistantBar.classList.remove('speaking');
            if (statusText) statusText.textContent = 'Tap to speak';
        }
    };

    SpeechSynthesis.speak(utterance);
};


// --- Speech Recognition (Speech-to-Text) Setup ---
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false; // Only captures a single phrase
    recognition.interimResults = false; // Only provides final results
    recognition.lang = 'en-US'; // Set language to English (United States)

    recognition.onstart = () => {
        isListening = true;
        console.log("Listening for commands...");
        if (aliAiAssistantBar) {
            aliAiAssistantBar.classList.add('listening');
            if (statusText) statusText.textContent = 'Listening...';
        }
        if (transcriptionDisplay) {
            transcriptionDisplay.textContent = 'Listening...';
            transcriptionDisplay.classList.add('active');
        }
    };

    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript;
        console.log("Command received: " + command);
        if (transcriptionDisplay) {
            transcriptionDisplay.textContent = `You said: "${command}"`;
        }
        // Call the global processCommand function, which should be defined in each HTML file
        if (typeof window.processCommand === 'function') {
            window.processCommand(command);
        } else {
            console.warn("processCommand function not found in the current page's script.");
            window.speak("I'm not sure how to handle that command on this page.");
        }
    };

    recognition.onend = () => {
        isListening = false;
        console.log("Recognition ended.");
        if (aliAiAssistantBar) {
            aliAiAssistantBar.classList.remove('listening');
            if (statusText) statusText.textContent = 'Tap to speak';
        }
        if (transcriptionDisplay) {
            // Keep the transcription visible for a short time, then fade out
            setTimeout(() => {
                transcriptionDisplay.classList.remove('active');
            }, 3000); // Hide after 3 seconds
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error: ", event.error);
        isListening = false;
        if (aliAiAssistantBar) {
            aliAiAssistantBar.classList.remove('listening');
            if (statusText) statusText.textContent = 'Tap to speak';
        }
        if (transcriptionDisplay) {
            transcriptionDisplay.textContent = `Error: ${event.error}`;
            setTimeout(() => {
                transcriptionDisplay.classList.remove('active');
            }, 3000);
        }

        let errorMessage = "Sorry, I didn't catch that. Please try again.";
        if (event.error === 'not-allowed') {
            errorMessage = "Microphone access denied. Please enable it in your browser settings.";
        } else if (event.error === 'no-speech') {
            errorMessage = "No speech detected. Please speak clearly.";
        } else if (event.error === 'audio-capture') {
             errorMessage = "Could not access microphone. Is it in use by another application?";
        }
        window.speak(errorMessage);
    };

    // Event listener for the AI assistant bar click
    if (aliAiAssistantBar) {
        aliAiAssistantBar.addEventListener('click', () => {
            if (isSpeaking) {
                SpeechSynthesis.cancel(); // Stop Ali from speaking if user taps while she's talking
                isSpeaking = false;
                if (aliAiAssistantBar) {
                    aliAiAssistantBar.classList.remove('speaking');
                    if (statusText) statusText.textContent = 'Tap to speak';
                }
            }
            if (!isListening) {
                recognition.start();
            } else {
                recognition.stop(); // Stop listening if already active
            }
        });
    }

} else {
    // Fallback if Speech Recognition is not supported
    console.warn("Web Speech API (Speech Recognition) not supported in this browser.");
    if (aliAiAssistantBar) {
        aliAiAssistantBar.style.display = 'none'; // Hide the bar if not supported
    }
    document.addEventListener('DOMContentLoaded', () => {
        alert("Your browser does not support Web Speech API. Voice assistant features will not be available.");
    });
}