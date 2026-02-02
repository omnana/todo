# 技术设计

## 技术栈
- React + TypeScript + Vite
- Tailwind CSS
- Zustand
- React Router（如果需要多页面）
- data-fns
- LocalStorage

## 项目结构
```
src/
├── components/      # React组件
├── hooks/          # 自定义Hooks
├── stores/         # Zustand状态管理
├── types/          # TypeScript类型定义
├── utils/          # 工具函数
├── services/       # 数据服务（localStorage封装）
└── App.tsx
```

## 数据模型

​	1、任务状态：待办、已完成

​	2、任务字段：id(唯一标识)、title(标题)、desc(描述)、category(分类)、priority(优先级：低、中、高)、dueDate(截止日期)、completed(是否完成)、createdAt(创建日期)

## **关键技术**

​	1、使用 LocalStorage 存储数据

​	2、使用 React Hooks 管理状态
