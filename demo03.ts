import { ChatOpenAI } from "@langchain/openai";
import { BaseChatMessageHistory, BaseListChatMessageHistory, InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnablePassthrough, RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import 'dotenv/config'
import type { BaseMessage } from "@langchain/core/messages";

// model
const model = new ChatOpenAI({model: "gpt-3.5-turbo"});

// prompt
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `あなたは私が送ったメッセージをすべて覚えている親切なアシスタントです。`,
  ],
  ["placeholder", "{chat_history}"],
  // equivalent to the following code:
  // new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

// chain
const chain = RunnableSequence.from([
  RunnablePassthrough.assign({
    chat_history: ({ chat_history }: { chat_history: BaseMessage[] }) => {
      return chat_history.slice(-3);
    },
  }),
  prompt,
  model,
]);
const messageHistories: Record<string, InMemoryChatMessageHistory> = {};

const withMessageHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: async (sessionId): Promise<BaseListChatMessageHistory | BaseChatMessageHistory> => {
    if (messageHistories[sessionId] === undefined) {
      const messageHistory = new InMemoryChatMessageHistory();
      messageHistories[sessionId] = messageHistory;
    }
    // console.log(messageHistories[sessionId]?.getMessages())
    return messageHistories[sessionId]!;
  },
  inputMessagesKey: "input",
  historyMessagesKey: "chat_history",
});

const configSessionId1 = {
  configurable: {
    sessionId: "abcd1",
  },
};
const response1SessionId1 = await withMessageHistory.invoke(
  {
    input: "私の好きなアイスクリームはチョコレートです",
  } as { chat_history: BaseMessage[]; input: string },
  configSessionId1
) 
console.log(response1SessionId1.content);
const response2SessionId1 = await withMessageHistory.invoke(
  {
    input: "私の好きなアイスクリームは？",
  } as { chat_history: BaseMessage[]; input: string },
  configSessionId1
) 
console.log(response2SessionId1.content);


const configSessionId2 = {
  configurable: {
    sessionId: "abcd2",
  },
};
const response1SessionId2 = await withMessageHistory.invoke(
  {
    input: "私の好きなアイスクリームは？",
  } as { chat_history: BaseMessage[]; input: string },
  configSessionId2
) 
console.log(response1SessionId2.content);