export const recallPrompts = Object.fromEntries(`
001|Maya receives “Request received” and calls reception. What would you inspect beyond the confirmation screen to understand her experience?
002|Two booking screens look equally polished. What would you need to observe before judging which is more usable, and for whom?
003|A booking flow is fast but leaves Maya anxious. Distinguish a usability goal from an experience goal, then propose evidence for each.
004|The flow works at a desk but fails on a train. Which parts of the context changed, and how should they affect the design?
005|The app says the referral was sent; the clinic cannot find it. Which service connections must you investigate?
006|Completion rises while confused calls increase. Which dimensions of UX quality does that result leave unresolved?
007|Why can a person miss a banner that is plainly visible? Separate noticing, understanding, and acting in your explanation.
008|How do proximity, alignment, and grouping change what someone believes belongs together on an appointment page?
009|Why can a short interruption cost more than the time it occupies? Explain what the person must recover afterward.
010|How would you replace unnecessary recall in clinic comparison without making every detail visible at once?
011|An early appointment is selected by default. How could that change the decision, and what would make the default defensible?
012|The connection drops after submission. What is known, what remains uncertain, and why might an immediate retry be unsafe?
013|Distinguish Maya’s goal, a task that supports it, and an interface action. What changes if she chooses a different strategy?
014|Maya and the clinic predict different next steps from the same status. How would you discover and repair that mismatch?
015|What must a conceptual model specify about referrals and appointments before the team designs their screens?
016|What useful expectations does a queue metaphor create? Name an expectation that could become misleading in CarePath.
017|What work would a screen flow miss when Maya cannot find a suitable slot? Include a decision, handoff, and recovery.
018|Why is “Maya phones after booking” insufficient to justify a dashboard? Give two interpretations and different requirements they imply.
019|What makes a research question capable of changing a decision? Include the owner, uncertainty, and possible response.
020|Unpack “let patients choose another clinic” into assumptions. Which uncertain assumption could invalidate the whole idea?
021|What different claims can an interview, observation, survey, and experiment support? Which would you use first here, and why?
022|Why might testing with colleagues miss the most important failure? Describe a sampling dimension connected to the decision.
023|What must a participant understand and be able to control before sharing sensitive information in research?
024|Separate observation, explanation, and proposed intervention. What additional evidence would support each step?
025|What makes discovery a continuing practice? Describe a decision that should change after a new customer encounter.
026|How could clinic comparison ship successfully while failing its intended outcome? Trace the missing causal steps.
027|Why does asking about the last real episode reveal different evidence from asking about a future feature?
028|Distinguish an outcome, opportunity, and solution using the appointment problem. Why does the separation matter?
029|How do you choose the smallest test for a risky assumption? Explain why testing a whole polished idea may miss it.
030|What should another person be able to trace in a design decision record, including the uncertainty?
031|Why is a frequently repeated word not yet a theme? Explain what connects an evidence pattern to its context and consequence.
032|Move from one observed call to a possible insight. Where does inference enter, and how could it be challenged?
033|What earns a persona a place in the design process? Give a contextual detail that changes a decision and one that does not.
034|Which details turn a user action into a useful scenario? Explain how one interruption changes the design requirements.
035|When would you use a journey map, and when would you need a blueprint? Show what each reveals about a wait.
036|How can a research story be memorable while preserving uncertainty? Name the decision it should help an audience make.
037|How can useful content remain unfindable? Explain the relationship between structure, labels, navigation, and the person’s task.
038|What should a label help someone predict? Describe how you would find out whether an internal term makes that promise.
039|What does a person arriving through a deep link need to know about location, related options, and returning?
040|What makes a search result give strong information scent before someone opens it?
041|How does “Send request” change an interaction compared with “Submit”? What system fact must the wording reflect?
042|After a failed submission, which questions must an error message answer before a person can act safely?
043|What about the activity determines whether commands, conversation, manipulation, or exploration is a suitable interaction style?
044|What must a control communicate before and after activation? Include discoverability and the consequence of its action.
045|How would you decide whether a form field is necessary? Connect the question to purpose, timing, and user effort.
046|Distinguish acknowledgement, processing, and completion. Why is disabling a button not enough feedback?
047|How should a page’s visual hierarchy reflect the next decision? Name something that deserves to remain secondary.
048|What changes besides width when a desktop task moves to mobile? Explain the implications for comparison and continuity.
049|Why is a shared component library alone insufficient to solve inconsistent product behaviour?
050|Which behaviours make a component complete beyond its default visual state? Explain why one matters to the task.
051|How can inconsistent confirmation wording break an otherwise consistent design system?
052|What makes a good design-system pilot? Explain how its scope should expose useful variation without requiring a full migration.
053|Who should be involved when a team changes a shared component? Include contribution, exceptions, and communication.
054|Why can installation counts rise while product quality stays unchanged? Propose a more useful pair of measures.
055|What must work beyond the app for a service promise to be reliable? Follow one dependency to its owner.
056|How do findability and understandability determine whether someone can receive a service at all?
057|Trace a frontstage confirmation to its backstage dependencies. Which failure would make the promise untrue?
058|What does a blueprint add to a journey map when nobody owns an update during a wait?
059|Why might frontline participation change a service model? Explain how to treat a workaround as evidence.
060|What can a service rehearsal reveal that a successful screen prototype cannot?
061|What decision should a prototype answer? Explain how that question determines what you make realistic.
062|How can a team mistake a validated need for a validated solution? Describe how to reopen the alternatives.
063|What would you observe in a usability session to distinguish successful clicking from correct understanding?
064|What can an expert inspection find, and what cannot it establish about real use?
065|What turns an evaluation observation into a finding that can guide action? Include consequence and confidence.
066|Why can changing everything at once make iteration harder to interpret? Explain how to choose the next change.
067|How could a booking event represent several different outcomes? Sketch the behaviour model needed to interpret it.
068|What should an overall evaluation criterion represent, and which harms must still prevent a positive decision?
069|Distinguish a primary metric, diagnostic metric, guardrail, and data-quality check in the same experiment.
070|What causal question can a randomised test answer? State its population, treatment, comparison, and outcome.
071|Why is a statistically significant result untrustworthy when assignment or event definitions differ between groups?
072|What should a team preserve after an invalid experiment so that others can learn from it?
073|How can a person’s capabilities and circumstances vary across the same journey? Explain why a single average user is inadequate.
074|Break a verification step into human demands. Where might those demands exceed the resources available to someone?
075|What makes a dialog operable beyond its appearance? Describe focus, keyboard, announcement, and recovery behaviour.
076|If colour or spatial layout disappears, how should status remain understandable and actionable?
077|How would you distinguish helpful guidance from manipulation in a preselected appointment choice?
078|What makes consent meaningful beyond a recorded click? Include refusal, later control, and accountability.
079|Which part of a proposed feature actually needs inference? Compare it with a non-AI way of meeting the need.
080|How can automation increase while meaningful human control remains strong? Specify authority and the chance to intervene.
081|What should a person accurately predict about an AI feature? Explain why maximum trust is not the aim.
082|How should an AI system recover after turning missing evidence into a confident claim? Separate feedback from immediate recourse.
083|Why does model accuracy alone fail to establish product value? Describe the additional layers of evaluation.
084|What can drift even if a model’s measured accuracy remains stable? Name a signal, owner, and response.
085|Turn a feature request into an opportunity statement. What evidence would make you choose a different opportunity?
086|What makes a product principle useful in a contested decision? Include its rationale and an exception boundary.
087|How should evidence discovered during delivery change the work? Describe the connection that keeps discovery and delivery aligned.
088|What belongs in a decision narrative when the audience has a competing commitment? Include counterevidence and trade-offs.
089|How can locally reasonable decisions create an incoherent service? Explain which decision rights or shared rules are missing.
090|How could a promising launch create burden over time? Trace value across repeated use, maintenance, and exit.
091|How does a product teardown differ from a screenshot critique? Include observation, competing explanation, and system context.
092|What makes a problem frame useful without prematurely choosing the solution? Give two competing frames for one breakdown.
093|How should a discovery plan connect decisions, assumptions, methods, and thresholds before work begins?
094|Why can a coherent screen fail on top of incoherent data and service states? Name the models that must agree.
095|How can the same mechanism create value for one group and harm for another? Describe a risk and a proportionate control.
096|What makes a design case defensible? Explain how a reviewer can trace the recommendation and challenge its weakest claim.
097|How does evidence change the framing, design, or decision in human-centred work? What would make the process mere ceremony?
098|When might a human service or policy repair be better than digitisation? Include the people and costs hidden by a narrow business case.
099|How should a status remain meaningful without colour? Connect the non-colour cue to text and programmatic information.
100|How do scanning and careful reading need different support? Describe a hierarchy that helps both without hiding consequential detail.
101|Distinguish necessary decision complexity from burden created by the interface. What should the design preserve and remove?
102|What does a person need to resume after an interruption when the underlying state may have changed?
103|How can a product support learning and expert speed without splitting people into two permanent categories?
104|How do size, distance, spacing, and movement conditions affect an action? Include a boundary on what speed predicts.
105|What gives a person justified confidence after a failure? Explain the role of evidence and actual control alongside tone.
106|What must a waiting state say about known progress, uncertainty, leaving, and completion? Compare seconds with days.
107|Why is the happy path insufficient as a workflow model? Include exception work, handoffs, and competing beliefs about state.
108|What different jobs do a scenario, user story, use case, and specification perform? Trace one requirement between them.
109|Why must user, content, data, quality, and constraint requirements be considered together? Name a conflict between two.
110|Distinguish principles, heuristics, guidelines, and patterns. How would you decide whether a familiar pattern fits this task?
111|What would make a research plan executable and capable of changing a decision before commitment?
112|How might policy, incentives, or capacity cause a customer-facing problem? Describe the evidence needed beyond customer interviews.
113|What can a competitor’s interface tell you, and what remains unknown about the service behind it?
114|What probes help reconstruct a past episode without leading the participant toward your preferred explanation?
115|What might observation reveal that an interview misses? How would you investigate a workaround without disrupting important work?
116|When does an experience require longitudinal research? Explain how missing entries and repeated prompts can affect interpretation.
117|Why might a strong survey preference fail to predict use? Include construct, sample, wording, and behaviour.
118|What does an abandonment rate establish, and what evidence could distinguish the mechanisms beneath it?
119|What changes when product, design, and engineering share discovery early enough to influence the decision?
120|How does an opportunity-solution tree preserve the connection between outcome and test? Where can the tree oversimplify reality?
121|What should a discovery cadence make possible between formal studies? Explain when reviewing existing evidence is the right next step.
122|Which parts of ResearchOps protect participants and make evidence usable? Which judgements should remain contextual?
123|How would you trace a theme back to episodes and negative cases? What would make the theme too weak to use?
124|When analytics, interviews, and support disagree, how should you investigate rather than choose a favourite source?
125|What makes a vivid story representative enough to teach a pattern? How should you communicate its boundary?
126|How can the same evidence support different audiences without changing the underlying claim or confidence?
127|What should a content inventory uncover before a navigation redesign? Include authority, duplication, and outdated promises.
128|How do content types, attributes, and relationships prevent the same fact from drifting across pages?
129|When should information be organised by task, topic, audience, or an exact scheme? Explain a trade-off.
130|How can controlled vocabulary and synonyms connect everyday language to precise internal concepts?
131|What should navigation reveal to someone arriving in the middle of a complex information space?
132|How should results, facets, and a no-results state help a person recover a search and make a decision?
133|Distinguish metadata, taxonomy, ontology, and folksonomy using one content collection. What does each make possible?
134|How does a link’s information scent help someone judge the next step before committing to it?
135|What different relationships do sitemaps and wireflows expose? Why is a polished isolated screen insufficient?
136|What must be owned and governed for information architecture to survive content and organisational change?
137|What makes product content a coherent strategy across onboarding, empty states, help, and email?
138|How does plain language change a person’s ability to act? Explain why merely shortening technical wording may be insufficient.
139|How can a stable voice adapt its tone to a consequential failure? What should take priority over personality?
140|What should survive when content is read in a different order or through a different sensory channel?
141|How would you test whether changing a word changes someone’s understanding of consequence or reversibility?
142|What connects a policy change to every place that communicates it? Include ownership and verification after publication.
143|How do you preserve one truthful service state across an app, notification, and support conversation?
144|What assumptions travel with a familiar interaction pattern? How would you check whether they fit the new workflow?
145|How should the person’s environment and work determine the interaction medium? Include a situation where touch is unsuitable.
146|What makes a shortcut safe and learnable as well as fast? Explain how it relates to visible commands.
147|How should selection and bulk action preserve control when the list can change underneath the person?
148|What must a creation flow preserve across save, preview, interruption, conflict, and failure?
149|Distinguish feedforward from feedback. What must be clear before commitment and after the system acts?
150|Why can explaining everything at first use prevent learning? Describe when guidance becomes useful.
151|What information must accompany a trend before it can support a decision? Include uncertainty and comparison context.
152|How should a collaborative product make identity, shared state, conflict, and the safety of individual work visible?
153|Who are a design system’s users, and how would you discover whether the system solves their recurring problems?
154|What must stay aligned between design tokens, component specifications, content, and production code?
155|How should a system handle contribution, versioning, migration, and exceptions without making local work impossible?
156|How can a component spread an accessibility defect? Explain what evidence belongs in its quality contract.
157|What does an ecosystem map reveal about power, value, dependencies, and people who do not directly use the app?
158|How would you research a service delay across people, policy, and operations before choosing an interface intervention?
159|Why are capacity and policy part of experience design? Explain what happens when the interface promises more than operations can deliver.
160|How could a lower average wait conceal a worse service? Identify whose outcome and labour need to be measured.
161|How might efficiency for one group shift cost or exclusion to another? Explain what an equitable service evaluation should include.
162|How can a team preserve meaningful alternatives while still converging on a decision? Name the evidence used to narrow them.
163|What can sketching the same scenario reveal about apparent agreement within a team?
164|How do you choose prototype fidelity for waiting, changing data, or staff judgement? What must actually behave realistically?
165|What turns a critique from preference sharing into a decision practice? Describe a useful question and evidence boundary.
166|How should an evaluation strategy match different methods to different risks, people, and conditions?
167|When would moderated research be necessary before unmoderated testing? Include learning risk and participant welfare.
168|What can Fitts’ Law or GOMS help estimate, and what parts of the experience remain outside those estimates?
169|How should consequence, confidence, dependencies, and effort shape the order of responses to findings?
170|Distinguish an input, output, outcome, and guardrail. Why should different teams not blindly share one target?
171|How do a North Star and One Metric That Matters serve different decisions? What must neither be allowed to hide?
172|What different questions do funnels, cohorts, retention, and conversion answer about progress over time?
173|Why might fresher clinic data correlate with acceptance without causing it? Give a plausible confounder.
174|How do assignment unit, exposure, and analysis level affect an experiment where staff influence multiple patients?
175|What should be decided about meaningful effect and sensitivity before checking statistical significance?
176|What makes an event definition trustworthy across multiple systems? Explain why reservation and acceptance must remain distinct.
177|What distinguishes an organisation that runs many experiments from one that reliably learns and changes decisions?
178|How can individually usable steps create cumulative exclusion? Describe the burden that a whole-journey audit should trace.
179|How do learning from edge experiences and co-design differ? What makes participation capable of changing a decision?
180|Distinguish user-centred, universal, participatory, and inclusive design. Explain one useful combination and its limits.
181|Why is a clean automated scan insufficient for an accessibility conformance claim? What scope and evidence are needed?
182|How can accessibility regress after a successful review? Describe an ownership and monitoring loop that catches it.
183|How would you decide whether a proposed data field is proportionate? Include purpose, alternatives, refusal, and lifecycle.
184|How can equal rules create unequal burdens? Explain whose outcomes, power, and recourse must enter the decision.
185|What makes ethical escalation effective when a junior researcher challenges a fixed launch date?
186|What should a human-and-AI storyboard expose beyond the successful output? Include authority, uncertainty, and failed handoffs.
187|How does an AI intervention change a decision system beyond the interface? Trace one feedback loop or dependency.
188|How should a metaphor follow an AI system’s actual authority? Name an expectation a teammate metaphor could wrongly create.
189|Why can an answer with real citations still be unsafe? Include applicability, currency, conflict, and recourse.
190|How does a prediction become an intervention policy? Explain the role of thresholds, consequence, and review capacity.
191|Who enters the research scope when AI changes a workflow? Include people affected without directly using the feature.
192|What responsibility remains with a researcher using AI to synthesise evidence? Describe how to check a proposed theme.
193|Which changes can RITE make quickly, and which questions require a different evaluation approach?
194|Why is trustworthy AI a system property? Connect a model claim to an operational control and evidence of its effectiveness.
195|How could rising agreement with an AI recommendation indicate review collapse? Explain how to investigate independently.
196|How do accountability, expertise, contribution, and authority differ in a contested product decision?
197|What keeps learning inside delivery when estimates and commitments have already been made?
198|What makes an MVP a valid and ethical test of value? Name something small scope must not remove.
199|Why does usability evidence fail to validate the underlying problem or eventual outcome? Separate the questions.
200|What must a rollout plan make possible during a partial failure? Include affected-person discovery, pause, recovery, and resumption.
201|How does uncertainty about substitutions change a grocery journey before checkout? Connect the design to fulfilment incentives and recovery.
202|Why can hiding detail make an enterprise task less safe? Explain what expert comparison, roles, and exception handling require.
203|What makes an appointment-change service coherent across digital, telephone, staff, policy, and capacity?
204|Why is completion insufficient for a high-stakes service? Explain the evidence, accessible alternatives, appeal, and remedy a responsible design needs.
`.trim().split('\n').map(line=>{const at=line.indexOf('|');return ['UX-'+line.slice(0,at),line.slice(at+1)]}));
