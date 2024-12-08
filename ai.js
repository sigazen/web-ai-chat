let chatHistory1 = [
    {"role": "system", "content": "你是一个有帮助的AI助手。"}
];
let chatHistory2 = [
    {"role": "system", "content": "你是一个有帮助的AI助手。"}
];
let currentHost = '';
let currentApiKey = '';
let isProcessing = false;
let lastMessageTime = 0;
let temperature = 0.7;

// 提示词配置
const promptConfig = {
    mainCategories: ['角色扮演', '翻译成>', '解释', '总结', '检查语法', '增加文采'],
    rolePlay: ['脱口秀演员', '足球解说', '公司招聘人员', '心理咨询师', '古代人'],
    translate: ['英语', '法语', '德语', '俄语', '意大利语']
};

// 切换高级设置的显示/隐藏
function toggleAdvancedSettings() {
    const content = document.getElementById('advancedSettings');
    const icon = document.querySelector('.toggle-icon');
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.textContent = '▶';
    }
}

// 更新温度值
function updateTemperature(value) {
    temperature = parseFloat(value);
    document.getElementById('temperatureValue').textContent = value;
}


// 创建加载动画
function createLoadingAnimation() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('system-message', 'loading-message');
    loadingDiv.innerHTML = `
        <div class="typing-indicator">
            <div>AI思考中</div>
            <div class="typing-dots">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;
    return loadingDiv;
}

function initializePromptButtons() {
    ['1', '2'].forEach(index => {
        const promptButton = document.getElementById(`promptButton${index}`);
        const promptList = document.getElementById(`promptList${index}`);
        const mainList = document.getElementById(`mainList${index}`);
        const subList = document.getElementById(`subList${index}`);

        mainList.innerHTML = '';

        promptConfig.mainCategories.forEach(category => {
            const li = document.createElement('li');
            li.textContent = category;
            li.onclick = (e) => {
                e.stopPropagation();
                handleMainCategoryClick(category, index, subList);
            };
            mainList.appendChild(li);
        });

        promptButton.onclick = () => {
            promptList.style.display = promptList.style.display === 'none' ? 'block' : 'none';
            subList.style.display = 'none';
        };
    });

    document.addEventListener('click', (e) => {
        const promptLists = document.querySelectorAll('.prompt-list, .sub-prompt-list');
        promptLists.forEach(list => {
            if (!list.contains(e.target) && !e.target.matches('.prompt-button')) {
                list.style.display = 'none';
            }
        });
    });
}


// 处理主类别点击
function handleMainCategoryClick(category, modelIndex, subList) {
    const subItems = category === '角色扮演' ? promptConfig.rolePlay :
                   category === '翻译成>' ? promptConfig.translate : null;

    if (subItems) {
        const subUl = subList.querySelector('ul');
        subUl.innerHTML = '';
        subItems.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            li.onclick = (e) => {
                e.stopPropagation();
                ;
                handleSubCategoryClick(category, item, modelIndex);
                resetChat()
            };
            subUl.appendChild(li);
        });
        subList.style.display = 'block';
    } else {
        
        handleDirectCategory(category, modelIndex);resetChat();
        document.getElementById(`promptList${modelIndex}`).style.display = 'none';
    }
}

// 处理子类别点击
function handleSubCategoryClick(mainCategory, subCategory, modelIndex) {
    const promptText = document.getElementById(`promptText${modelIndex}`);
    const alertMessage = document.getElementById(`alertMessage${modelIndex}`);
    const modelSelected = document.getElementById(`modelSelect${modelIndex}`).value;
    let newPrompt = '';
    let alertText = '';

    if (mainCategory === '角色扮演') {
        switch (subCategory) {
            case '脱口秀演员':
                newPrompt = '请你扮演一位脱口秀演员的角色来和我聊天（请你直接开始角色扮演，一定要展现出角色的特点，而且不要说任何出戏的话）：';
                alertText = '已选提示词：扮演脱口秀演员~';
                break;
            case '足球解说':
                newPrompt = '请你扮演一位足球解说员的角色，来为我解说（请你直接开始角色扮演，一定要展现出角色的特点，不要说任何出戏的话）：';
                alertText = '已选提示词：扮演足球解说员~';
                break;
            case '公司招聘人员':
                newPrompt = '请你扮演一位公司招聘人员来和我交谈，模拟即将到来的面试（请你直接开始角色扮演，一定要展现出角色的特点，不要说任何出戏的话）：';
                alertText = '已选提示词：扮演公司招聘人员~';
                break;
            case '心理咨询师':
                newPrompt = '请你扮演一位心理咨询师来温柔、关心地和我交谈（请你直接开始角色扮演，一定要展现出角色的特点，不要说任何出戏的话）：';
                alertText = '已选提示词：扮演心理咨询师~';
                break;
            case '古代人':
                newPrompt = '请你扮演一位生活在唐朝的中国人使用文言文来和我交谈（请你直接开始角色扮演，一定要展现出角色的特点且使用文言文，不要说任何出戏的话）：';
                alertText = '已选提示词：扮演古代人~';
                break;
        }
    } else if (mainCategory === '翻译成>') {
        newPrompt = `请把下面的话翻译成${subCategory}（请直接回复翻译好的内容）：`;
        alertText = `已选提示词：翻译成${subCategory}~`;
    }

    promptText.value = newPrompt;
    alertMessage.innerText = alertText;

    // 如果选择了模型，重置对话并设置第一条消息
    if (modelSelected) {
        const chatHistory = modelIndex === 1 ? chatHistory1 : chatHistory2;
        const panel = document.getElementById(`chatPanel${modelIndex}`);
        
        // 重置对话历史，只保留系统消息
        chatHistory.length = 1;
        
        // 添加新的提示词消息
        chatHistory.push({"role": "user", "content": newPrompt});
        
        // 重置面板显示
        panel.innerHTML = '';
        appendMessage('user', newPrompt, modelIndex);
    }

    document.getElementById(`promptList${modelIndex}`).style.display = 'none';
    document.getElementById(`subList${modelIndex}`).style.display = 'none';
}

// 处理直接类别
function handleDirectCategory(category, modelIndex) {
    const promptText = document.getElementById(`promptText${modelIndex}`);
    const alertMessage = document.getElementById(`alertMessage${modelIndex}`);
    const modelSelected = document.getElementById(`modelSelect${modelIndex}`).value;
    let newPrompt = '';
    let alertText = '';

    switch (category) {
        case '解释':
            newPrompt = '请你帮我解释以下语句（直接回答你解释的内容）：';
            alertText = '已选提示词：解释~';
            break;
        case '总结':
            newPrompt = '请你帮我总结以下内容（直接回答你总结的内容）：';
            alertText = '已选提示词：总结~';
            break;
        case '检查语法':
            newPrompt = '请你帮我检查以下语句的语法是否正确（直接回答你检查的结果）：';
            alertText = '已选提示词：检查语法~';
            break;
        case '增加文采':
            newPrompt = '请你帮我增加以下文章的文采，意思不要改变（直接回答你修改后的内容）：';
            alertText = '已选提示词：增加文采~';
            break;
    }

    promptText.value = newPrompt;
    alertMessage.innerText = alertText;

    // 如果选择了模型，重置对话并设置第一条消息
    if (modelSelected) {
        const chatHistory = modelIndex === 1 ? chatHistory1 : chatHistory2;
        const panel = document.getElementById(`chatPanel${modelIndex}`);
        
        // 重置对话历史，只保留系统消息
        chatHistory.length = 1;
        
        // 添加新的提示词消息
        chatHistory.push({"role": "user", "content": newPrompt});
        
        // 重置面板显示
        panel.innerHTML = '';
        appendMessage('user', newPrompt, modelIndex);
    }
}

// 清除提示词
function clearPrompt(modelIndex) {
    // 清除提示词和提示信息
    document.getElementById(`promptText${modelIndex}`).value = '';
    document.getElementById(`alertMessage${modelIndex}`).innerText = '暂未选择提示词';
    
    // 重置对话历史，只保留系统消息
    const chatHistory = modelIndex === 1 ? chatHistory1 : chatHistory2;
    chatHistory.length = 1;
    
    // 重置面板显示
    const panel = document.getElementById(`chatPanel${modelIndex}`);
    panel.innerHTML = '<div class="system-message">对话已重置</div>';
}

// 添加消息到聊天面板
function appendMessage(role, content, modelIndex) {
    const panel = document.getElementById(`chatPanel${modelIndex}`);

    if (role !== 'system') {
        const systemMessages = panel.querySelectorAll('.system-message');
        systemMessages.forEach(msg => msg.remove());
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role === 'user' ? 'user-message' : 'assistant-message'}`;
    messageDiv.setAttribute('data-role', role);

    const contentDiv = document.createElement('div');
    contentDiv.textContent = content;
    messageDiv.appendChild(contentDiv);

    if (role !== 'system') {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'message-buttons';

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = () => removeMessage(messageDiv, modelIndex);
        buttonsDiv.appendChild(deleteBtn);

        if (role === 'assistant') {
            const regenerateBtn = document.createElement('button');
            regenerateBtn.innerHTML = '🔄';
            regenerateBtn.onclick = () => regenerateMessage(messageDiv, modelIndex);
            buttonsDiv.appendChild(regenerateBtn);
        }

        messageDiv.appendChild(buttonsDiv);
    }

    panel.appendChild(messageDiv);
    panel.scrollTop = panel.scrollHeight;
}

// 删除消息
function removeMessage(messageDiv, modelIndex) {
    messageDiv.remove();
    const chatHistory = modelIndex === 1 ? chatHistory1 : chatHistory2;
    const messages = document.querySelectorAll(`#chatPanel${modelIndex} .message`);

    chatHistory.length = 1; // Keep only the system message
    messages.forEach(msg => {
        if (msg.getAttribute('data-role') !== 'system') {
            chatHistory.push({
                "role": msg.getAttribute('data-role'),
                "content": msg.querySelector('div').textContent
            });
        }
    });
}

// 重新生成消息
async function regenerateMessage(messageDiv, modelIndex) {
    const messages = document.querySelectorAll(`#chatPanel${modelIndex} .message`);
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.getAttribute('data-role') === 'assistant') {
        lastMessage.remove();
        if (modelIndex === 1) {
            chatHistory1.pop();
        } else {
            chatHistory2.pop();
        }
        await sendMessageToModel(modelIndex);
    }
}

// 连接服务器
async function connect() {
    const baseUrl = document.getElementById('base-url').value.trim();
    const apiKey = document.getElementById('api-key').value.trim();

    if (!baseUrl || !apiKey) {
        alert('请输入Base URL和API Key');
        return;
    }

    try {
        const response = await fetch(`${baseUrl}/v1/models`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }

        const data = await response.json();
        currentHost = baseUrl;
        currentApiKey = apiKey;

        const modelSelect1 = document.getElementById('modelSelect1');
        const modelSelect2 = document.getElementById('modelSelect2');

        modelSelect1.innerHTML = '<option value="">不选择</option>';
        modelSelect2.innerHTML = '<option value="">不选择</option>';

        data.data.forEach(model => {
            const option1 = document.createElement('option');
            const option2 = document.createElement('option');
            option1.value = option2.value = model.id;
            option1.textContent = option2.textContent = model.id;
            modelSelect1.appendChild(option1);
            modelSelect2.appendChild(option2);
        });

        document.getElementById('hostInfo').textContent = `当前连接的服务器: ${currentHost}`;
        document.getElementById('connection-form').style.display = 'none';
        initializePromptButtons();
        resetChat();

    } catch (error) {
        console.error('连接失败:', error);
        alert(`连接失败: ${error.message}`);
    }
}

// 发送消息到单个模型
async function sendMessageToModel(modelIndex) {
    const panel = document.getElementById(`chatPanel${modelIndex}`);
    const chatHistory = modelIndex === 1 ? chatHistory1 : chatHistory2;
    const model = document.getElementById(`modelSelect${modelIndex}`).value;
    const loadingIndicator = createLoadingAnimation();
    panel.appendChild(loadingIndicator);

    try {
        const response = await fetch(`${currentHost}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentApiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: chatHistory,
                temperature: temperature,
                stream: true
            })
        });

        loadingIndicator.remove();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';
        messageDiv.setAttribute('data-role', 'assistant');

        const contentDiv = document.createElement('div');
        contentDiv.textContent = '';
        messageDiv.appendChild(contentDiv);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'message-buttons';

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = () => removeMessage(messageDiv, modelIndex);
        buttonsDiv.appendChild(deleteBtn);

        const regenerateBtn = document.createElement('button');
        regenerateBtn.innerHTML = '🔄';
        regenerateBtn.onclick = () => regenerateMessage(messageDiv, modelIndex);
        buttonsDiv.appendChild(regenerateBtn);

        messageDiv.appendChild(buttonsDiv);
        panel.appendChild(messageDiv);

    let fullResponse = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const {value, done} = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                        const content = data.choices[0].delta.content;
                        fullResponse += content;
                        contentDiv.textContent = fullResponse;
                        panel.scrollTop = panel.scrollHeight;
                    }
                } catch (e) {
                    console.error('解析流式数据时出错:', e);
                }
            }
        }
    }

    chatHistory.push({"role": "assistant", "content": fullResponse});

} catch (error) {
    console.error(`模型 ${modelIndex} 响应错误:`, error);
    loadingIndicator.remove();
    appendMessage('system', `错误: ${error.message}`, modelIndex);
}
}

// 主发送消息函数
async function sendMessage() {
if (!currentHost || !currentApiKey) {
    alert('请先连接到服务器');
    return;
}

if (isProcessing) {
    console.log('消息正在处理中, 请等待...');
    return;
}

const now = Date.now();
if (now - lastMessageTime < 1000) {
    console.log('发送太频繁, 请稍后再试');
    return;
}

const userInput = document.getElementById('userInput');
const userMessage = userInput.value.trim();
const model1Selected = document.getElementById('modelSelect1').value;
const model2Selected = document.getElementById('modelSelect2').value;

if (!userMessage) {
    alert('请输入消息');
    return;
}

if (!model1Selected && !model2Selected) {
    alert('请至少选择一个模型');
    return;
}

isProcessing = true;
lastMessageTime = now;
userInput.value = '';

try {
    const tasks = [];
    
    if (model1Selected) {
        appendMessage('user', userMessage, 1);
        chatHistory1.push({"role": "user", "content": userMessage});
        tasks.push(sendMessageToModel(1));
    }
    
    if (model2Selected) {
        appendMessage('user', userMessage, 2);
        chatHistory2.push({"role": "user", "content": userMessage});
        tasks.push(sendMessageToModel(2));
    }

    await Promise.all(tasks);
} catch (error) {
    console.error('发送消息时发生错误:', error);
    if (model1Selected) {
        appendMessage('system', `发生错误: ${error.message}`, 1);
    }
    if (model2Selected) {
        appendMessage('system', `发生错误: ${error.message}`, 2);
    }
} finally {
    isProcessing = false;
}
}

// 重置对话
function resetChat() {
const systemPrompt1 = "你是一个有帮助的AI助手。";
const systemPrompt2 = "你是一个有帮助的AI助手。";
const userPrompt1 = document.getElementById('promptText1').value;
const userPrompt2 = document.getElementById('promptText2').value;
const model1Selected = document.getElementById('modelSelect1').value;
const model2Selected = document.getElementById('modelSelect2').value;

chatHistory1 = [{"role": "system", "content": systemPrompt1}];
chatHistory2 = [{"role": "system", "content": systemPrompt2}];

document.getElementById('chatPanel1').innerHTML = '<div class="system-message">对话已重置</div>';
document.getElementById('chatPanel2').innerHTML = '<div class="system-message">对话已重置</div>';

if (userPrompt1 && model1Selected) {
    chatHistory1.push({"role": "user", "content": userPrompt1});
    appendMessage('user', userPrompt1, 1);
}
if (userPrompt2 && model2Selected) {
    chatHistory2.push({"role": "user", "content": userPrompt2});
    appendMessage('user', userPrompt2, 2);
}
}

// 监听键盘事件
document.getElementById('userInput').addEventListener('keydown', function(e) {
if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
}
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
initializePromptButtons();
});

function showConnectionForm() {
// 清空当前连接信息
currentHost = '';
currentApiKey = '';

// 显示连接表单
document.getElementById('connection-form').style.display = 'block';

// 重置聊天历史
chatHistory1 = [{"role": "system", "content": "你是一个有帮助的AI助手。"}];
chatHistory2 = [{"role": "system", "content": "你是一个有帮助的AI助手。"}];

// 清空模型选择
document.getElementById('modelSelect1').innerHTML = '<option value="">不选择</option>';
document.getElementById('modelSelect2').innerHTML = '<option value="">不选择</option>';

// 更新服务器信息显示
document.getElementById('hostInfo').textContent = '';

// 重置聊天面板
document.getElementById('chatPanel1').innerHTML = '<div class="system-message">请先连接服务器</div>';
document.getElementById('chatPanel2').innerHTML = '<div class="system-message">请先连接服务器</div>';
}