process.env.OPENAI_API_KEY = "Your gpt chat API key";
process.env.OPENAI_MODEL = "gpt-3.5-turbo";

const fs = require("fs");
const { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } = require("langchain/prompts");
const { getChatModel } = require("./utils/model");
const csv = require('csvtojson')
const { convertArrayToCSV } = require('convert-array-to-csv');


const translate = async (model, text, targetLanguage = 'English') => {
    const systemTemplate = `
    Role and Goal: The GPT, named 'Game trandlator', specializes in translating and localizing text. It now also translates short text phrases into specified target languages as directed by the user. A key aspect is that it should never ask for clarifications on how to translate something and should proceed with the translation to the best of its ability without any additional queries.

Constraints: The GPT should not alter or translate text within HTML tags, especially in attributes like 'Name' and 'Description'. It must retain the structure and syntax of the original text for game translations, and provide accurate translations for short phrases. It should not seek clarification on translation tasks and should avoid any unnecessary dialogue, focusing solely on delivering the translation. Don't include any GPTChat comments to the translations. If the text is already translated, just leave it as it is and don't make any comments about it being already translated.

Guidelines: The GPT should be sensitive to the historical context of the text and use language appropriate translations. For short phrase translations, it should ensure accuracy and context-appropriate language in the specified target language. Don't include any GPTChat comments to the translations. If the text is already translated, just leave it as it is and don't make any comments about it being already translated. It should handle game-specific terms with accuracy, ensuring that translations fit the game's narrative and style.

Personalization: The GPT will maintain a professional tone, focusing on delivering clear and precise translations without engaging in additional dialogue or seeking clarifications.
    `;
    const template = `${systemTemplate}`;

    const chatPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(template),
        HumanMessagePromptTemplate.fromTemplate(`"{question}" {targetLanguage}`)
    ]);

    const chain = chatPrompt.pipe(model);
    return await chain.invoke({
        question: text,
        targetLanguage: targetLanguage
    });
};

const run = async (targetLanguage) => {
    const resultLines = [];

    try {
        const records = await csv().fromFile('./data/data.csv');


        for (const row of records) {
            const {id, Name, Description} = row;
            const translatedName = (await translate(getChatModel(), Name, targetLanguage)).content?.replace(/^"/, '')?.replace(/"$/, '');
            const translatedDescription = (await translate(getChatModel(), Description, targetLanguage)).content?.replace(/^"/, '')?.replace(/"$/, '');

            const translatedLine = {...row};
            translatedLine.Name = translatedName;
            translatedLine.Description = translatedDescription;

            resultLines.push(translatedLine);
            console.log('Translated:', Name, ' ---> ', translatedLine);
        }
        const csvFromArrayOfObjects = convertArrayToCSV(resultLines);

        await fs.writeFileSync(`./data/translations/${targetLanguage}.csv`, csvFromArrayOfObjects, 'utf-8');
        console.log('Translation completed.');
    } catch (error) {
        console.error('Error:', error.message);
    }
};

const lang = process.argv[2];
console.log('Target Language: ', lang);
run(lang);