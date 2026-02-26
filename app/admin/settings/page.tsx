import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const markdownContent = `
# 設定画面

<details>
<summary className="cursor-pointer font-bold text-xl mb-4">LINEユーザー管理</summary>

### 1. ユーザーリスト

- [ユーザーリスト](/admin/line-users)

**SWF-TEST2にログインしたLINEユーザーの一覧をここに表示できます。**

### 2. 関連リンク

- [世田谷ウォーキングフォーラム](https://setagaya-walking-forum.jimdoweb.com)
- [SWFテストサイト](https://swf1000.jimdofree.com/)
- [SWF芦花公園グループ](https://chiku.setagayashakyo.or.jp/member/detail/745)

</details>

<details>
<summary className="cursor-pointer font-bold text-xl mb-4">Google Calendar 連携表示</summary>

- [gcal連携画面表示](/admin/gcal)

</details>

<details>
<summary className="cursor-pointer font-bold text-xl">サンプルを表示</summary>

- スタイルが当たらない場合はキャッシュを消してください。
- サーバーを再起動してください。
</details>
`;

export default function Page() {
  return (
    <div className="p-10 bg-white min-h-screen">
      <article className="prose max-w-none">
        {/* rehypeRaw を使うことで HTMLタグを解釈させます */}
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
          {markdownContent}
        </ReactMarkdown>
      </article>
    </div>
  );
}