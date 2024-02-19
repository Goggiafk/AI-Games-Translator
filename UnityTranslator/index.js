process.env.OPENAI_API_KEY = "Your gpt chat API key";
process.env.OPENAI_MODEL = "gpt-4-0613";

const fs = require('fs');
const {ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate} = require("langchain/prompts");
const {getChatModel} = require("./utils/model");

const translate = async (model, text, targetLanguage = 'English') => {
    const systemTemplate = `
    Role and Goal: The GPT, named 'Translator AI', specializes in translating and localizing text. It now also translates short text phrases into specified target languages as directed by the user. A key aspect is that it should never ask for clarifications on how to translate something and should proceed with the translation to the best of its ability without any additional queries.

Constraints: The GPT should not alter or translate text within HTML tags, especially in attributes like 'id'. It must retain the structure and syntax of the original text for game translations, and provide accurate translations for short phrases. It should not seek clarification on translation tasks and should avoid any unnecessary dialogue, focusing solely on delivering the translation.

Guidelines: The GPT should be sensitive to use language appropriate for young generation and slang naturally in game translations. For short phrase translations, it should ensure accuracy and context-appropriate language in the specified target language. It should handle game-specific terms with accuracy, ensuring that translations fit the game's narrative and style.

Personalization: The GPT will maintain a professional tone, focusing on delivering clear and precise translations without engaging in additional dialogue or seeking clarifications.
    `;
    const template = `${systemTemplate}`;

    const chatPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(template),
        HumanMessagePromptTemplate.fromTemplate(`"{question}" {targetLanguage}`)
    ])

    const chain = chatPrompt.pipe(model);
    return await chain.invoke({
        question: text,
        targetLanguage: targetLanguage
    });
};

const run = async (targetLanguage) => {
    const origin = fs.readFileSync('./data/data.asset', 'utf-8');
    const parts = origin.split('\n\n');
    const resultParts = [];
    let i = 0;
    for (let part of parts) {
        let newParts = part.split("\n");
        let mLocalized = newParts.find(n => n.includes('m_Localized:'))?.replace(`m_Localized:`, '')?.replace(/^"/, '')?.replace(/"$/, '');
        let msgstr = (await translate(getChatModel(), mLocalized, targetLanguage)).content?.replace(/^"/, '')?.replace(/"$/, '');
        resultParts.push(part.replace('m_Localized:', `m_Localized: ${msgstr}`));
        console.log(`${i}/${parts.length}`, mLocalized, ' ---> ', msgstr)
        i++;
    }
    return resultParts;
};

const lang = process.argv[2];
console.log('Target Language: ', lang);
run(lang).then(result => {
    fs.writeFileSync(`./data/translations/${lang}.asset`, result.join("\n\n"), 'utf-8');
});

