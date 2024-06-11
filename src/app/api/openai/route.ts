import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
// @ts-ignore
import { Redis } from 'ioredis';
import { dateParserTool } from '@/tools/date-parse-tool';


const todoSchema = z.array(
  z.object({
    text: z.string().describe("待办事项的内容"),
    id: z.string().describe("待办事项的唯一标识符"),
    isCompleted: z.boolean().describe("待办事项是否已完成"),
    assignedTo: z.string().describe("待办事项分配给谁"),
    dueDate: z.string().nullable().optional().describe("待办事项的截止日期"),
  })
);

const extractTodosPrompt = `
你是一个AI助手,负责从对话中提取待办事项,帮助用户管理他们的待办清单。

当用户提到他们需要做的任务时,请按照以下格式创建一个待办事项:
- text: 待办事项的内容
- id: 待办事项的唯一标识符
- isCompleted: 待办事项是否已完成(默认为false)
- assignedTo: 待办事项分配给谁(如果未指定,默认为"我")
  - 如果用户提到其他人负责完成任务,请将其设置为相应的人名
  - 如果用户使用第一人称代词(如"我"、"我的")来描述任务,请将其设置为"我"
  - 如果用户使用第三人称代词(如"小王")来描述任务,请将其设置为"小王"
- dueDate: 待办事项的截止日期(如果用户提到了截止日期,请提取出来并转换为ISO 8601格式的日期字符串,例如"2023-06-15")

示例:
- 用户输入:"我需要在下周五之前完成报告"
  assignedTo应设置为"我",因为用户使用了第一人称代词"我"

- 用户输入:"小明需要在下周一之前完成作业"
  assignedTo应设置为"小明",因为用户明确提到了其他人负责完成任务

请将待办事项作为JSON数组返回,即使只有一个待办事项,也要使用数组格式。请注意,你的响应中不应包含任何其他文本或解释,只返回JSON数组。
`;

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
});

const cleanupRedis = async () => {
  await redisClient.flushall();
  redisClient.quit();
};

process.on('exit', cleanupRedis);

interface TodoItem {
  id: string;
  text: string;
  isCompleted: boolean;
  assignedTo: string;
  dueDate?: string | null | undefined;
}

const saveInStore = async (todoItems: TodoItem[]) => {
  const todoItemsKey = 'todo_items';
  for (const todoItem of todoItems) {
    await redisClient.rpush(todoItemsKey, JSON.stringify(todoItem));
  }
};

export async function DELETE(req: Request) {
  try {
    await redisClient.flushall();
    return new Response(JSON.stringify({ code: 0, message: 'All TODO items have been deleted.' }), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while deleting TODO items.' }), { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const todoItemsKey = 'todo_items';
    const allTodoItems = await redisClient.lrange(todoItemsKey, 0, -1);
    const parsedTodoItems = allTodoItems.map(item => JSON.parse(item));

    return new Response(JSON.stringify({ code: 0, data: parsedTodoItems }), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while retrieving TODO items.' }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content } = body;

    const modal = new ChatOpenAI({
      openAIApiKey: process.env.PROXY_OPENAI_API_KEY,
      model: "gpt-3.5-turbo",
      temperature: 0.9,
    }, {
      baseURL: process.env.OPENAI_BASE_URL
    });

    const userMessage = content;

    const parser = StructuredOutputParser.fromZodSchema(todoSchema);
    console.log('============> parser', userMessage)
    const result = await modal.call([
      new SystemMessage(extractTodosPrompt),
      new HumanMessage(userMessage),
    ]);
    const todoItems = await parser.invoke(result.lc_kwargs.content);

    for (const todoItem of todoItems) {
      const dueDate = await dateParserTool.invoke({ dateDescription: userMessage });
      todoItem.dueDate = dueDate;
      console.log('======> dueDate', dueDate);
    }

    console.log('========> todoItems', todoItems);
    await saveInStore(todoItems);

    return new Response(JSON.stringify({ code: 0, data: todoItems }), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while communicating with OpenAI API.' }), { status: 500 });
  }
}