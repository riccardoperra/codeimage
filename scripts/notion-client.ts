import {Client} from '@notionhq/client';
import {env} from 'node:process';
import {join} from 'path';
import {writeFileSync} from 'fs';

const notionJsonPath = join(
  __dirname,
  '..',
  'apps',
  'codeimage',
  'src',
  'test.json',
);
const secrets = env.NOTIONS_API;
const databaseId = env.NOTIONS_DATABASE_ID;

const notion = new Client({auth: secrets});

(async () => {
  console.log({secrets, databaseId});
  const response = await notion.databases.query({
    database_id: databaseId!,
    filter: {
      or: [{property: 'Tags', multi_select: {contains: 'major'}}],
    },
  });
  const {id} = response.results[0];
  // const page = await notion.pages.retrieve({page_id: id});
  const blocks = await notion.blocks.children.list({
    block_id: id,
    page_size: 100,
  });

  const blocksDepured = blocks.results.map(block => {
    return {[block.type]: block[block.type]};
  });
  writeFileSync(notionJsonPath, JSON.stringify(blocksDepured, null, 2));
})();
