import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
// @ts-ignore
import * as chrono from 'chrono-node';

dayjs.locale('zh-cn');

const dateParserTool = new DynamicStructuredTool({
  name: "date_parser",
  description: "用于从口语中的日期描述中提取标准格式的日期字符串(YYYYMMDD)。如果无法提取日期,则返回null。",
  schema: z.object({
    dateDescription: z.string().describe("口语中的日期描述"),
  }),
  func: async ({ dateDescription }: { dateDescription: string }) => {
    const results = chrono.parse(dateDescription);

    console.log('==========> results', results)

    if (results.length > 0) {
      const parsedDates = results.map(result => {
        const date = result.start.date();
        if (dayjs(date).isValid()) {
          throw new Error('日期格式不正确');
        }
        return dayjs(date).format('YYYYMMDD');
      });
      console.log('==========> parsedDates', parsedDates)
      return parsedDates.join(', '); // 返回所有匹配的日期,用逗号分隔
    } else {
      return dayjs().format('YYYY-MM-DD hh:mm:ss'); // 无法解析日期时返回null
    }
  },
});

export { dateParserTool };