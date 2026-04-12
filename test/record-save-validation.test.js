import test from "node:test";
import assert from "node:assert/strict";

import { getDraftSaveValidationMessage } from "../src/components/record-utils.js";

test("allows saving when only the title is filled", () => {
  assert.equal(
    getDraftSaveValidationMessage({
      title: "只有标题",
      body: "",
    }),
    null
  );
});

test("rejects saving when title is empty", () => {
  assert.equal(
    getDraftSaveValidationMessage({
      title: "   ",
      body: "正文",
    }),
    "标题不能为空。"
  );
});
