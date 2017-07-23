import * as ts from 'typescript';

export const RelativeImportsLocator = (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    const relativeRegExp = /^\..*/;
    let relativeImports: Array<string> = [];

    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration:
                const importDecl: ts.ImportDeclaration = node as ts.ImportDeclaration;
                const moduleName = (<any>importDecl.moduleSpecifier).text;
                if (relativeRegExp.test(moduleName)) {
                    relativeImports.push(moduleName);
                }
            default:
                return ts.visitEachChild(node, visitor, context);
        }
    };

    const transformer: ts.Transformer<ts.SourceFile> = (sf: ts.SourceFile) => {
        relativeImports = [];
        const result = ts.visitNode(sf, visitor);
        (<any>RelativeImportsLocator).relativeImports = relativeImports;
        return result;
    }

    return transformer;
};