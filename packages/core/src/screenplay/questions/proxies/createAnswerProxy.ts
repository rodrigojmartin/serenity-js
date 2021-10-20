import { LogicError } from '../../../errors';
import { inspected } from '../../../io/inspected';
import { Actor } from '../../actor';
import { Answerable } from '../../Answerable';
import { Question } from '../../Question';

export type SyncAnswerType<Result> =
    Result extends Promise<infer A>
        ? A
        : Result;

type AnswerableParameters<T extends unknown[]> =
    { [P in keyof T]: Answerable<T[P]> }

// https://stackoverflow.com/questions/48215950/exclude-property-from-type

// https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/#key-remapping-in-mapped-types
type NonQuestionSpecificProperties<T> = {
    [Key in keyof T as Exclude<Key, keyof Question<T>>]: T[Key];
}

/* eslint-disable @typescript-eslint/indent */
export type AnswerProxy<OriginalType> = {
    [Field in keyof NonQuestionSpecificProperties<OriginalType>]:
    // is it a method?
    OriginalType[Field] extends (...args: infer OriginalParameters) => infer OriginalMethodResult
        // make the method asynchronous
        ? (...args: AnswerableParameters<OriginalParameters>) => Question<Promise<SyncAnswerType<OriginalMethodResult>>> & AnswerProxy<OriginalMethodResult>
        // is it an object?
        : Question<Promise<OriginalType[Field]>> & AnswerProxy<OriginalType[Field]>
}

/* eslint-enable @typescript-eslint/indent */

export function createAnswerProxy<A, Q extends Question<A> = Question<A>>(question: Q): Q & AnswerProxy<SyncAnswerType<A>> {

    return new Proxy<Q>(question, {

        get(target: Q, key: string | symbol | number, receiver: any) {
            if (key === Symbol.toPrimitive) {
                return (_hint: 'number' | 'string' | 'default') => {
                    return target.toString();
                }
            }

            if (key in target) {
                return Reflect.get(target, key, receiver);
            }

            if (doNotProxy(key)) {
                return;
            }

            const fieldDescription = (typeof key === 'number' || /^\d+$/.test(String(key)))
                ? `[${ String(key) }]`  // array index
                : `.${ String(key) }`;  // field/method name

            // when property is invoked as a method
            function proxy(...originalParameters) {

                const parameterDescriptions = [
                    '(',
                    originalParameters.map(p => inspected(p, { inline: true, markQuestions: true })).join(', '),
                    ')'
                ].join('');

                const originalSubject = inspected(question, { inline: true, markQuestions: true });

                return Question.about(originalSubject + fieldDescription + parameterDescriptions, async actor => {
                    // convert parameters from Answerable<T> => T
                    const parameters = await (Promise.all(
                        originalParameters.map(parameter => actor.answer(parameter))
                    ));

                    // resolve the original answer
                    const answer = await actor.answer(target);

                    // invoke the method call on the original answer
                    return answer[key](...parameters)
                });
            }

            const originalSubject = inspected(question, { inline: true, markQuestions: true });

            proxy.subject = originalSubject + fieldDescription

            // when property is accessed as a field
            proxy.answeredBy = async (actor: Actor) => {
                const answer = await actor.answer(target);

                if (answer === undefined) { // todo: or null?
                    throw new LogicError(`${ target } is undefined, can't read property "${ String(key) }"`);
                }

                return answer[key];
            };

            proxy.toString = () => {
                return proxy.subject;
            };

            proxy.describedAs = (newSubject: string) => {
                proxy.subject = newSubject;

                return proxy;
            }

            proxy.as = <O>(mapping: (answer: SyncAnswerType<A>) => O): Question<Promise<O>> => {
                return Question.about<Promise<O>>(`${ proxy.subject } as ${ inspected(mapping, { inline: true }) }`, async actor => {
                    const answer = await actor.answer(proxy)
                    return mapping(answer);
                });
            }

            return createAnswerProxy(proxy as any);
        }
    }) as Q & AnswerProxy<SyncAnswerType<A>>
}

function doNotProxy(key: string | symbol | number) {
    const prohibited: Array<string | symbol | number> = [
        'then', // don't proxy Promises
    ];

    return prohibited.includes(key)
}