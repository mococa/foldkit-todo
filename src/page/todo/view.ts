import { Submodel } from 'foldkit';

import { definePage } from '../../lib/router';
import { Message as RootMessage } from '../../message';
import { SITE_NAME } from '../../site';
import { Message } from './logic/message';
import { Model } from './logic/model';

type TodoPageInputs = Readonly<{ todo: Model }>;

export const TodoView = Submodel.defineView<Model, Message>((model, h) =>
  h.div(
    [h.Class('mx-auto grid w-full max-w-xl gap-6 p-6')],
    [
      h.h1([h.Class('text-3xl font-bold')], ['Todo']),
      h.form(
        [h.Class('flex gap-2'), h.OnSubmit(Message.SubmittedTodo())],
        [
          h.input([
            h.Type('text'),
            h.Value(model.todoDraft),
            h.Placeholder('Add a todo'),
            h.Class(
              'min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2',
            ),
            h.OnInput(value => Message.ChangedTodoDraft({ value })),
          ]),
          h.button(
            [
              h.Type('submit'),
              h.Class(
                'rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white',
              ),
            ],
            ['Add'],
          ),
        ],
      ),
      h.ul(
        [h.Class('grid gap-2')],
        model.todos.map(todo =>
          h.keyed('li')(
            todo.id,
            [
              h.Class(
                'flex items-center gap-3 rounded-md border border-zinc-200 px-3 py-2',
              ),
            ],
            [
              h.button(
                [
                  h.OnClick(Message.ToggledTodo({ id: todo.id })),
                  h.Class('text-lg'),
                ],
                [todo.completed ? '✓' : '○'],
              ),
              h.span(
                [
                  h.Class(
                    todo.completed ? 'line-through opacity-60' : 'opacity-100',
                  ),
                ],
                [todo.title],
              ),
              h.button(
                [
                  h.OnClick(Message.DeletedTodo({ id: todo.id })),
                  h.Class('ml-auto text-sm text-red-600'),
                ],
                ['Delete'],
              ),
            ],
          ),
        ),
      ),
      h.button(
        [
          h.OnClick(Message.ClickedLogout()),
          h.Class(
            'w-fit rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100',
          ),
        ],
        ['Sign out'],
      ),
    ],
  ),
);

export const TodoPage = definePage({
  tag: 'Todo',
  path: '',
  metadata: {
    title: `Todo | ${SITE_NAME}`,
    description: 'Manage your drawing studio tasks.',
  },
  view: (_route, h, inputs: TodoPageInputs) =>
    h.submodel({
      slotId: 'todo',
      model: inputs.todo,
      view: TodoView,
      toParentMessage: message =>
        // oxlint-disable-next-line typescript/consistent-type-assertions
        RootMessage.GotTodoMessage({ message }) as never,
    }),
});
