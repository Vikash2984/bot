const LETTER_POOL = document.getElementById('letter-pool');
const TEMP_LETTER_POOL = document.getElementById('temp-letter-pool');
const LETTER_OVERLAY = document.getElementById('letter-overlay');
const CHAT_MESSAGE_COLUMN_WRAPPER = document.getElementById('chat-message-column-wrapper');
const CHAT_MESSAGE_COLUMN = document.getElementById('chat-message-column');
const MESSAGE_INPUT = document.getElementById('message-input');
const MESSAGE_INPUT_FIELD = document.getElementById('message-input-field');
const CHAT_BOT_MOOD = document.getElementById('chat-bot-mood');
const CHAT_BOT_MOOD_VALUE = document.getElementById('chat-bot-mood-value');
const SEND_MESSAGE_BUTTON = document.getElementById('send-message-button');

const STATE = {
    isUserSendingMessage: false,
    isChatBotSendingMessage: false,
    letterPool: {
        transitionPeriod: 30000,
        intervals: []
    },
    moods: ['friendly', 'suspicious', 'boastful'],
    currentMood: '',
    chatbotMessageIndex: 0,
    nLetterSets: 3
};

const getRand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandExcept = (min, max, except) => {
    let rand = getRand(min, max);
    while (rand === except) {
        rand = getRand(min, max);
    }
    return rand;
};

const getRandPosOffScreen = (rand) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    switch (rand) {
        case 1: return { x: getRand(0, windowWidth), y: -100 };
        case 2: return { x: windowWidth + 100, y: getRand(0, windowHeight) };
        case 3: return { x: getRand(0, windowWidth), y: windowHeight + 100 };
        case 4: return { x: -100, y: getRand(0, windowHeight) };
        default: return { x: 0, y: 0 };
    }
};

const getRandPosInScreen = () => {
    return {
        x: getRand(0, window.innerWidth),
        y: getRand(0, window.innerHeight)
    };
};

const getRandMood = () => {
    const rand = getRand(0, STATE.moods.length - 1);
    return STATE.moods[rand];
};

const setChatbotMood = () => {
    STATE.currentMood = getRandMood();
    CHAT_BOT_MOOD.className = STATE.currentMood;
    CHAT_BOT_MOOD_VALUE.textContent = STATE.currentMood;
};

const createLetter = (cName, val) => {
    const letter = document.createElement('div');
    letter.className = cName;
    letter.setAttribute('data-letter', val);
    letter.textContent = val;
    return letter;
};

const getAlphabet = (isUpperCase) => {
    let letters = [];
    for (let i = 65; i <= 90; i++) {
        let val = String.fromCharCode(i);
        if (!isUpperCase) val = val.toLowerCase();
        letters.push(createLetter('pool-letter', val));
    }
    return letters;
};

const startNewLetterPath = (letter, nextRand, interval) => {
    clearInterval(interval);
    nextRand = getRandExcept(1, 4, nextRand);
    let nextPos = getRandPosOffScreen(nextRand);
    let transitionPeriod = STATE.letterPool.transitionPeriod;
    let delay = getRand(0, STATE.letterPool.transitionPeriod);
    let transition = `left ${transitionPeriod}ms linear ${delay}ms, top ${transitionPeriod}ms linear ${delay}ms, opacity 0.5s`;
    letter.style.left = `${nextPos.x}px`;
    letter.style.top = `${nextPos.y}px`;
    letter.style.transition = transition;
    interval = setInterval(() => {
        startNewLetterPath(letter, nextRand, interval);
    }, STATE.letterPool.transitionPeriod + delay);
    STATE.letterPool.intervals.push(interval);
};

const setRandLetterPaths = (letters) => {
    for (let i = 0; i < letters.length; i++) {
        let letter = letters[i];
        let startRand = getRand(1, 4);
        let nextRand = getRandExcept(1, 4, startRand);
        let startPos = getRandPosOffScreen(startRand);
        let nextPos = getRandPosInScreen();
        let transitionPeriod = STATE.letterPool.transitionPeriod;
        let delay = getRand(0, STATE.letterPool.transitionPeriod) * -1;
        let transition = `left ${transitionPeriod}ms linear ${delay}ms, top ${transitionPeriod}ms linear ${delay}ms, opacity 0.5s`;
        
        letter.style.left = `${startPos.x}px`;
        letter.style.top = `${startPos.y}px`;
        letter.style.transition = transition;
        letter.classList.add('invisible');
        LETTER_POOL.appendChild(letter);
        setTimeout(() => {
            letter.style.left = `${nextPos.x}px`;
            letter.style.top = `${nextPos.y}px`;
            letter.classList.remove('invisible');
            let interval = setInterval(() => {
                startNewLetterPath(letter, nextRand, interval);
            }, STATE.letterPool.transitionPeriod + delay);
        }, 1);
    }
};

const fillLetterPool = (nSets = 1) => {
    for (let i = 0; i < nSets; i++) {
        const lCaseLetters = getAlphabet(false);
        const uCaseLetters = getAlphabet(true);
        setRandLetterPaths(lCaseLetters);
        setRandLetterPaths(uCaseLetters);
    }
};

const clearLetterPool = () => {
    LETTER_POOL.innerHTML = '';
};

const scrollToBottomOfMessages = () => {
    CHAT_MESSAGE_COLUMN_WRAPPER.scrollTo({
        top: CHAT_MESSAGE_COLUMN_WRAPPER.scrollHeight,
        behavior: 'smooth'
    });
};

const checkMessageColumnHeight = () => {
    if (CHAT_MESSAGE_COLUMN.clientHeight >= window.innerHeight - 90) {
        CHAT_MESSAGE_COLUMN.classList.remove('static');
    } else {
        CHAT_MESSAGE_COLUMN.classList.add('static');
    }
};

const createChatMessage = (text, isReceived) => {
    let message = document.createElement('div');
    let profileIcon = document.createElement('div');
    let icon = document.createElement('i');
    let content = document.createElement('div');
    let contentText = document.createElement('h1');
    let direction = isReceived ? 'received' : 'sent';
    
    content.className = 'content';
    contentText.className = 'text';
    contentText.textContent = text;
    content.appendChild(contentText);
    
    profileIcon.className = 'profile-icon';
    profileIcon.appendChild(icon);
    
    message.className = `message ${direction}`;
    
    if (isReceived) {
        icon.className = 'fab fa-cloudsmith';
        message.classList.add(STATE.currentMood);
        message.appendChild(profileIcon);
        message.appendChild(content);
    } else {
        icon.className = 'far fa-user';
        message.appendChild(content);
        message.appendChild(profileIcon);
    }
    
    return message;
};

const animateMessageLetters = (message) => {
    const content = message.getElementsByClassName('content')[0];
    const contentText = content.getElementsByClassName('text')[0];
    const letters = contentText.textContent.split('');
    
    letters.forEach((letter, index) => {
        if (letter.trim() !== '') {
            const overlayLetter = document.createElement('span');
            overlayLetter.className = 'overlay-letter';
            overlayLetter.textContent = letter;
            
            const startPos = getRandPosOffScreen(getRand(1, 4));
            const endPos = getRandPosInScreen();
            
            overlayLetter.style.left = `${startPos.x}px`;
            overlayLetter.style.top = `${startPos.y}px`;
            overlayLetter.style.opacity = '0';
            LETTER_OVERLAY.appendChild(overlayLetter);
            
            setTimeout(() => {
                overlayLetter.style.transition = 'all 2s ease-out';
                overlayLetter.style.left = `${endPos.x}px`;
                overlayLetter.style.top = `${endPos.y}px`;
                overlayLetter.style.opacity = '1';
                overlayLetter.classList.add('in-flight');
                
                setTimeout(() => {
                    overlayLetter.style.transition = 'opacity 1s ease-in';
                    overlayLetter.style.opacity = '0';
                    
                    setTimeout(() => {
                        LETTER_OVERLAY.removeChild(overlayLetter);
                    }, 1000);
                }, 3000);
            }, index * 50);
        }
    });
};

const addChatMessage = (text, isReceived) => {
    const message = createChatMessage(text, isReceived);
    const content = message.getElementsByClassName('content')[0];
    const contentText = content.getElementsByClassName('text')[0];
    
    CHAT_MESSAGE_COLUMN.appendChild(message);
    toggleInput();
    
    // Start the letter animation in the background
    setTimeout(() => {
        animateMessageLetters(message);
    }, 100);
    
    scrollToBottomOfMessages();
    checkMessageColumnHeight();
};

const clearInputField = () => {
    MESSAGE_INPUT_FIELD.value = '';
    adjustTextareaHeight();
};

const toggleInput = () => {
    if (MESSAGE_INPUT_FIELD.value.trim().length > 0 && !STATE.isUserSendingMessage && !STATE.isChatBotSendingMessage) {
        MESSAGE_INPUT.classList.add('send-enabled');
    } else {
        MESSAGE_INPUT.classList.remove('send-enabled');
    }
};

const getRandGreeting = () => {
    const greetings = {
        friendly: [
            "Hiya, pal. I hope you're having a terrific day!",
            "Good day to you, friend!"
        ],
        suspicious: [
            "Hmm, I would introduce myself, but I'm not so sure that's a good idea.",
            "Hello, how are you? Wait, don't answer that, I have no way of verifying your response!"
        ],
        boastful: [
            "Hey, did I mention I am built with JavaScript? Which is the greatest language ever by the way!",
            "Good day to you. Though I must say that I am having a GREAT day!"
        ]
    };
    return greetings[STATE.currentMood][getRand(0, greetings[STATE.currentMood].length - 1)];
};

const getRandConvo = () => {
    const convo = {
        friendly: [
            "What a great thing you just said. I'm so glad you said it.",
            "Ahh, yes, I agree. It is so great to say things, isn't it?",
            "Please, tell me more. It brings me such joy to respond to the things you say.",
            "Ahh, yes valid point. Or was it? Either way, you're fantastic!",
            "Anyways, did I mention that I hope you're having a great day? If not, I hope it gets better!"
        ],
        suspicious: [
            "I just don't know if I can trust that thing you just said...",
            "Oh, interesting. I totally believe you. (Not really)",
            "Uh-huh, yeah, listen...I'm not going to fully invest in this conversation until I'm certain I know your motive.",
            "Wait, what the heck is that?? Oh, phewf, it's just another rogue letter 'R' that escaped the letter pool.",
            "You can't fool me, I know that's not true!"
        ],
        boastful: [
            "That's interesting. I'll have you know that I have an extremely advanced learning algorithm that analyzes everything you say...well, not really, but I wish.",
            "Hey, while I have you, I should probably tell you that I can respond in 4 seconds flat. Which is pretty fast if you ask me.",
            `Listen, that's neat and all, but look how fast I can calculate this math problem: 12345 * 67890 = ${12345 * 67890}. Didn't even break a sweat.`,
            "Oh, I forgot to mention that I've existed for over 100,000 seconds and that's something I'm quite proud of.",
            "Wow, that's pretty cool, but not as cool as me. I'm pretty much the coolest chatbot ever."
        ]
    };
    return convo[STATE.currentMood][getRand(0, convo[STATE.currentMood].length - 1)];
};

const sendChatbotMessage = () => {
    STATE.isChatBotSendingMessage = true;
    toggleInput();
    setTimeout(() => {
        let message = STATE.chatbotMessageIndex === 0 ? getRandGreeting() : getRandConvo();
        addChatMessage(message, true);
        STATE.chatbotMessageIndex++;
        STATE.isChatBotSendingMessage = false;
        toggleInput();
    }, getRand(1000, 3000));
};

const sendUserMessage = () => {
    if (STATE.isUserSendingMessage || STATE.isChatBotSendingMessage) return;
    STATE.isUserSendingMessage = true;
    toggleInput();
    let message = MESSAGE_INPUT_FIELD.value;
    addChatMessage(message, false);
    clearInputField();
    STATE.isUserSendingMessage = false;
    sendChatbotMessage();
};

const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (MESSAGE_INPUT_FIELD.value.trim().length > 0) {
            sendUserMessage();
        }
    }
};

const adjustTextareaHeight = () => {
    MESSAGE_INPUT_FIELD.style.height = 'auto';
    let newHeight = MESSAGE_INPUT_FIELD.scrollHeight;
    if (newHeight > 130) {
        newHeight = 130;
        MESSAGE_INPUT_FIELD.style.overflowY = 'auto';
    } else {
        MESSAGE_INPUT_FIELD.style.overflowY = 'hidden';
    }
    MESSAGE_INPUT_FIELD.style.height = `${newHeight}px`;
};

const init = () => {
    fillLetterPool(STATE.nLetterSets);
    setChatbotMood();
    sendChatbotMessage();
    checkMessageColumnHeight();
    MESSAGE_INPUT_FIELD.addEventListener('input', () => {
        toggleInput();
        adjustTextareaHeight();
    });
    MESSAGE_INPUT_FIELD.addEventListener('keydown', handleKeyPress);
    SEND_MESSAGE_BUTTON.addEventListener('click', () => {
        if (MESSAGE_INPUT_FIELD.value.trim().length > 0) {
            sendUserMessage();
        }
    });
    window.addEventListener('resize', checkMessageColumnHeight);
};

init();