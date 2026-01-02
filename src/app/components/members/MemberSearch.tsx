import Form from "next/form";

export function MemberSearch({ defaultQuery = "" }: { defaultQuery?: string }) {
  return (
    <Form action="/members" className="flex gap-2">
      <input
        name="query"
        defaultValue={defaultQuery}
        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none"
        placeholder="Search Member"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        회원검색
      </button>
    </Form>
  );
}
