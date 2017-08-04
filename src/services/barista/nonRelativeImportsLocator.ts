import * as ts from 'typescript';

export const nonRelativeImportsLocator = (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    const nonRelativeRegExp = /^[^\.][\s\S]*/;
    let nonRelativeImports: Array<string> = [];

    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
                const importDecl: ts.ImportDeclaration = node as ts.ImportDeclaration;
                const moduleName = (<any>importDecl.moduleSpecifier).text;
                if (nonRelativeRegExp.test(moduleName)) {
                    nonRelativeImports.push(moduleName);
                }
                return ts.visitEachChild(node, visitor, context);
            default:
                return ts.visitEachChild(node, visitor, context);
        }
    };

    const transformer: ts.Transformer<ts.SourceFile> = (sf: ts.SourceFile) => {
        nonRelativeImports = [];
        const result = ts.visitNode(sf, visitor);
        (<any>nonRelativeImportsLocator).nonRelativeImports = nonRelativeImports;
        return result;
    };

    return transformer;
};