"use client";
import { useEffect, useState } from "react";
import { Input } from "antd";
import { TodoItem } from "@/components/TodoItem";

import { Todo } from "../types/todo";

export default function Home() {
  const [input, setInput] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);

  const getTodos = () => {
    fetch('api/openai').then(res => res.json()).then(res => {
              console.log(res.data)
              setTodos(res.data)
            })
  }

  useEffect(() => {
    getTodos()
  }, [])

  const deleteAllTodos = () => {
    fetch('api/openai', {
      method: 'DELETE',
    }).then(res => res.json()).then(() => {
      getTodos()
    })
  }

  return (
    <div className="border rounded-md max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold " onClick={deleteAllTodos}>Hello Todo Copilot 🪁</h1>
      <h2 className="text-base font-base mb-4">Todo List Example</h2>

      <div className="my-4">
        <Input onInput={e => setInput(e.target.value)} value={input} onPressEnter={(e) => {
          if (input.trim() === "" || !e.target.value) {
            getTodos()
            return ;
          }

          fetch('api/openai', {
            method: 'POST',
            body: JSON.stringify({ content: e.target.value }),
            headers: {
              'Content-Type': 'application/json'
            }
          }).then(() => {
            setInput('')
            getTodos()
          })
        }} />
      </div>

      <TodoList todos={todos} setTodos={setTodos} />
    </div>
  );
}

const TodoList = ({ todos, setTodos }: { todos: Todo[], setTodos: (v: Todo[]) => void }) => {
  // const [input, setInput] = useState("");

  const toggleComplete = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const assignPerson = (id: string, person: string | null) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id
          ? { ...todo, assignedTo: person ? person : undefined }
          : todo
      )
    );
  };

  return (
    <div>
      {todos.length > 0 && (
        <div className="border rounded-lg">
          {todos.map((todo, index) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              toggleComplete={toggleComplete}
              deleteTodo={deleteTodo}
              assignPerson={assignPerson}
              hasBorder={index !== todos.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

