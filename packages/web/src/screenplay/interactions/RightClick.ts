import { Answerable, AnswersQuestions, d, Interaction, UsesAbilities } from '@serenity-js/core';

import { PageElement } from '../models';
import { PageElementInteraction } from './PageElementInteraction';

/**
 * Instructs an {@apilink Actor|actor} who has the {@apilink Ability|ability} to {@apilink BrowseTheWeb}
 * to perfom a right click on a given {@apilink PageElement}.
 *
 * This is typically used to open a [custom context menu](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event)
 * on a given Web element, since it's not possible to interact with the standard context menu offered by your browser.
 *
 * ## Example widget
 *
 * ```html
 * <form>
 *   <input type="text" id="field"
 *     oncontextmenu="showMenu(); return false;" />
 *
 *   <div id="context-menu" style="display:none">
 *     Custom context menu
 *   </div>
 * </form>
 *
 * <script>
 *   function showMenu() {
 *     document.getElementById("context-menu").style.display = 'block';
 *   }
 * </script>
 * ```
 *
 * ## Lean Page Object describing the widget
 *
 * ```ts
 * import { By, PageElement } from '@serenity-js/web'
 *
 * class Form {
 *   static exampleInput = () =>
 *     PageElement.located(By.id('example'))
 *       .describedAs('example input')
 *
 *   static exampleContextMenu = () =>
 *     PageElement.located(By.id('context-menu'))
 *       .describedAs('example context menu')
 * }
 * ```
 *
 * ## Right-click on an element
 *
 * ```ts
 * import { actorCalled } from '@serenity-js/core'
 * import { RightClick, isVisible } from '@serenity-js/web'
 * import { Ensure } from '@serenity-js/assertions'
 *
 * await actorCalled('Chloé')
 *   .whoCan(BrowseTheWeb.using(browser))
 *   .attemptsTo(
 *     RightClick.on(Form.exampleInput()),
 *     Ensure.that(Form.exampleContextMenu(), isVisible()),
 *   )
 * ```
 *
 * ## Learn more
 *
 * - {@apilink BrowseTheWeb}
 * - {@apilink PageElement}
 *
 * @group Interactions
 */
export class RightClick extends PageElementInteraction {
    /**
     * Instantiates this {@apilink Interaction}.
     *
     * @param pageElement
     *  The element to be right-clicked on
     */
    static on(pageElement: Answerable<PageElement>): Interaction {
        return new RightClick(pageElement);
    }

    protected constructor(private readonly pageElement: Answerable<PageElement>) {
        super(d `#actor right-clicks on ${ pageElement }`);
    }

    /**
     * @inheritDoc
     */
    async performAs(actor: UsesAbilities & AnswersQuestions): Promise<void> {
        const element = await this.resolve(actor, this.pageElement);
        return element.rightClick();
    }
}
