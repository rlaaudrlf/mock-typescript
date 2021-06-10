import { Random } from "mockjs";
import {
  ClassDeclaration,
  ClassInstancePropertyTypes,
  InterfaceDeclaration,
  Project,
  PropertySignature,
  SourceFile,
} from "ts-morph";
const memoryProject = new Project({ useInMemoryFileSystem: true });
const project = new Project({ useInMemoryFileSystem: true });

function getClassName(sourceFile: SourceFile) {
  let names = sourceFile.getInterfaces();
  let namesClass = sourceFile.getClasses();

  return [
    ...names.map((value) => {
      return value.getName();
    }),
    ...namesClass.map((value) => {
      return value.getName();
    }),
  ];
}

export function getMockFromClass(text: string, documentText: string) {
  try {
    let result: string[] = [];
    let memoryProjectSourceFile: SourceFile | undefined = undefined;
    let projectSourceFile: SourceFile | undefined = undefined;
    try {
      memoryProjectSourceFile = memoryProject.createSourceFile("text.ts", text);
      projectSourceFile = project.createSourceFile(
        "documentText.ts",
        documentText
      );

      let classNames = getClassName(memoryProjectSourceFile);

      result = classNames.map((value) => {
        return JSON.stringify(
          genMock(projectSourceFile as SourceFile, value || "", 0)
        );
      });
    } finally {
      projectSourceFile && project.removeSourceFile(projectSourceFile);
      memoryProjectSourceFile &&
        memoryProject.removeSourceFile(memoryProjectSourceFile);
    }

    return result.join("\n");
  } catch (e) {
    throw new Error(e);
  }
}

function genMock(sourceFile: SourceFile, name: string, depth: number) {
  if (depth > 1000) {
    throw new Error("max depth!");
  }

  let classItem: ClassDeclaration | InterfaceDeclaration | undefined =
    sourceFile.getInterface(name);

  if (!classItem) {
    classItem = sourceFile.getClass(name);
  }

  if (!classItem) {
    return;
  }

  let obj: { [key: string]: any } = {};
  let instanceProperties: ClassInstancePropertyTypes[] | PropertySignature[] =
    [];
  if (classItem instanceof InterfaceDeclaration) {
    instanceProperties = classItem.getProperties();
  } else {
    instanceProperties = classItem.getInstanceProperties();
  }
  instanceProperties.forEach(
    (value: ClassInstancePropertyTypes | PropertySignature) => {
      let mockValue = genProperty(sourceFile, value, depth);
      obj[value.getName()] = mockValue;
    }
  );

  return obj;
}
function genProperty(
  sourceFile: SourceFile,
  value: PropertySignature | ClassInstancePropertyTypes,
  depth: number
) {
  let mockValue: any = undefined;
  let type = value.getType();

  if (type.isArray()) {
    let elementType = type.getArrayElementType();

    if (elementType) {
      let count = Math.floor(Math.random() * 10);
      let array = new Array(count);
      for (let i = 0; i < array.length; i++) {
        (elementType as any).getType = () => {
          return elementType;
        };

        array[i] = genProperty(sourceFile, elementType as any, depth);
      }
      mockValue = array;
    } else {
      mockValue = [];
    }
  } else if (type.isBoolean()) {
    mockValue = Random.boolean();
  } else if (type.isString()) {
    mockValue = Random.string();
  } else if (type.isNumber()) {
    mockValue = Random.natural();
  } else if (type.isTuple()) {
    mockValue = [];
  } else if (type.isInterface()) {
    mockValue = genMock(sourceFile, value.getType().getText(), depth);
  } else if (type.isClass()) {
    mockValue = genMock(sourceFile, value.getType().getText(), depth);
  }

  return mockValue;
}
