import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { z } from "zod";
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

const dateParserTool = new DynamicStructuredTool({
  name: "date_parser",
  description: "用于解析口语中的日期描述,并返回标准格式的日期字符串(YYYY年MM月DD日 hh:mm:ss)。如果无法提取日期,则返回当前日期。",
  schema: z.object({
    dateDescription: z.string().describe("口语中的日期描述"),
  }),
  func: async ({ dateDescription }: { dateDescription: string }) => {
    const chat = new ChatOpenAI({ 
      openAIApiKey: process.env.PROXY_OPENAI_API_KEY,
      model: "gpt-3.5-turbo",
      temperature: 0.9,
    }, {
      baseURL: process.env.OPENAI_BASE_URL
    });

    const parsePrompt = `
      你是一个日期解析助手,我会将当前的时间日期信息告诉你,你负责将口语中的日期描述推理转换为标准格式的时间日期字符串(YYYY年MM月DD日 hh:mm:ss)。
      如果没有有效的时间信息， 就取现在这个时刻的时间信息。
      现在的时间是${dayjs().format('YYYY年MM月DD日 hh:mm:ss')} ${dayjs().format('dddd')}
      请解析以下日期描述,并返回标准格式的日期字符串:
      ${dateDescription}
    `;

    const result = await chat.call([
      new SystemMessage(parsePrompt),
      new HumanMessage(dateDescription),
    ]);

    const parsedDate = result.lc_kwargs.content.trim();

    try {
      const pattern = /\d{4}年\d{2}月\d{2}日\s\d{2}:\d{2}/;
      const match = parsedDate.match(pattern);
      console.log('==========> parsedDate', parsedDate, match?.[0])

      if (match && match[0]) {
        return match[0]
      } else {
        return dayjs().format('YYYY年MM月DD日 hh:mm:ss');
      }
    } catch {
      return dayjs().format('YYYY年MM月DD日 hh:mm:ss');
    }
  },
});

export { dateParserTool };