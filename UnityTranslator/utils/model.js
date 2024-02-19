const { ChatOpenAI } = require("langchain/chat_models/openai");

const getChatModel = (config) => {
    const mergedConfig = {
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-16k-0613',
        streaming: true,
        verbose: false,
        ...config
    };

    return new ChatOpenAI(mergedConfig);
};

module.exports = { getChatModel };
