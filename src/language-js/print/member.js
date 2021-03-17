"use strict";

const {
  builders: { softline, group, indent },
} = require("../../document");
const { isNumericLiteral, isMemberExpression } = require("../utils");
const { printOptionalToken } = require("./misc");

function printMemberExpression(path, options, print) {
  const node = path.getValue();

  const parent = path.getParentNode();
  let firstNonMemberParent;
  let i = 0;
  do {
    firstNonMemberParent = path.getParentNode(i);
    i++;
  } while (
    firstNonMemberParent &&
    (isMemberExpression(firstNonMemberParent) ||
      firstNonMemberParent.type === "TSNonNullExpression")
  );

  const shouldInline =
    (firstNonMemberParent &&
      (firstNonMemberParent.type === "NewExpression" ||
        firstNonMemberParent.type === "BindExpression" ||
        (firstNonMemberParent.type === "AssignmentExpression" &&
          firstNonMemberParent.left.type !== "Identifier"))) ||
    node.computed ||
    (node.object.type === "Identifier" &&
      node.property.type === "Identifier" &&
      !isMemberExpression(parent));

  return [
    path.call(print, "object"),
    shouldInline
      ? printMemberLookup(path, options, print)
      : group(indent([softline, printMemberLookup(path, options, print)])),
  ];
}

function printMemberLookup(path, options, print) {
  const property = path.call(print, "property");
  const node = path.getValue();
  const optional = printOptionalToken(path);

  if (!node.computed) {
    // return [optional, softline, ".", property]; // READIER
    return [optional, ".", property];
  }

  if (!node.property || isNumericLiteral(node.property)) {
    // return [optional, indent([softline, "[", property, "]"])]; // READIER
    return [optional, "[", property, "]"];
  }

  return group([optional, "[", indent([softline, property]), softline, "]"]);
}

module.exports = { printMemberExpression, printMemberLookup };
