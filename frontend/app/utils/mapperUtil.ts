import type { Answer, Comment, Form } from "../api/types";

export const mapTableDataRecords = (
  tableData: Form,
  commentData: Comment[],
  answerData: Answer[],
) => {
  return tableData.records.map((question) => ({
    ...question,
    comments:
      groupByField<Comment>(commentData, "questionId")[question.id] || [],
    answers: groupByField<Answer>(answerData, "questionId")[question.id] || [],
  }));
};

export const groupByField = <T>(data: T[], key: keyof T) => {
  return data?.reduce(
    (map, item) => {
      const fieldValue = item[key];
      if (!map[fieldValue as string]) {
        map[fieldValue as string] = [];
      }
      map[fieldValue as string].push(item);
      return map;
    },
    {} as { [key: string]: T[] },
  );
};
