import { Ensure, equals, property } from '@serenity-js/assertions';
import { describe, it, test } from '@serenity-js/playwright-test';
import { Page, Photographer, TakePhotosOfFailures } from '@serenity-js/web';

import { TODO_ITEMS } from './test-data';
import { persistedItems, startWithAListContaining } from './todo-list-app/TodoApp';
import { isDisplayedAsCompleted, isDisplayedAsOutstanding, markAsCompleted } from './todo-list-app/TodoItem';
import { itemCalled, itemNames, items } from './todo-list-app/TodoList';

describe('Persistence', () => {

    test.use({
        defaultActorName: 'Serena',
        crew: [
            Photographer.whoWill(TakePhotosOfFailures),
        ],
    });

    describe('Todo List App', () => {

        it('should persist its data', async ({ actor }) => {
            await actor.attemptsTo(
                startWithAListContaining(TODO_ITEMS[0], TODO_ITEMS[1]),

                markAsCompleted(itemCalled(TODO_ITEMS[0])),

                Ensure.that(itemNames(), equals([
                    TODO_ITEMS[0],
                    TODO_ITEMS[1],
                ])),

                Ensure.that(items().get(0), isDisplayedAsCompleted()),
                Ensure.that(persistedItems()[0], property('completed', equals(true))),

                Ensure.that(items().get(1), isDisplayedAsOutstanding()),
                Ensure.that(persistedItems()[1], property('completed', equals(false))),

                Page.current().reload(),

                Ensure.that(items().get(0), isDisplayedAsCompleted()),
                Ensure.that(persistedItems()[0], property('completed', equals(true))),

                Ensure.that(items().get(1), isDisplayedAsOutstanding()),
                Ensure.that(persistedItems()[1], property('completed', equals(false))),
            );
        });
    });
});
