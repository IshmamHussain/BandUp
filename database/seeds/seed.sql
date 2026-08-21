-- =====================================================================
-- Seed data: realistic IELTS-style content for demo and development
-- Run AFTER schema.sql:  mysql -u root ielts_prep < database/seeds/seed.sql
-- =====================================================================
USE ielts_prep;

-- ---------------------------------------------------------------------
-- Reading passages (8 passages: diverse topics, difficulties, types)
-- ---------------------------------------------------------------------
INSERT INTO reading_passages (id, title, body, passage_type, difficulty, time_limit) VALUES
(1, 'The Rise of Urban Farming',
'Cities around the world are witnessing a quiet agricultural revolution. Rooftops, abandoned lots, and even underground tunnels are being transformed into productive farms. Urban farming, once dismissed as a hobbyist pursuit, is now recognised as a serious contributor to food security in densely populated areas.\n\nThe motivations behind this movement are varied. For some city governments, urban agriculture reduces the distance food travels from farm to plate, cutting transport emissions and delivering fresher produce. For community organisations, shared gardens strengthen neighbourhood ties and provide green space in concrete-heavy districts. For entrepreneurs, controlled-environment agriculture, including vertical farms and hydroponic systems, promises year-round production unaffected by weather.\n\nSingapore offers a striking example. With less than one percent of its land available for agriculture, the city-state imports over ninety percent of its food. In response, the government launched its "30 by 30" initiative, aiming to produce thirty percent of the nation''s nutritional needs locally by 2030. High-tech vertical farms now operate in retrofitted industrial buildings, producing leafy greens with a fraction of the water used in conventional farming.\n\nCritics, however, point to significant limitations. Energy costs for indoor farming remain high, particularly for lighting and climate control. The range of crops that can be grown profitably indoors is narrow, dominated by fast-growing salad vegetables rather than the staple grains that form the bulk of human diets. Some researchers argue that improving rural supply chains would achieve greater food security at lower cost.\n\nDespite these challenges, investment in urban agriculture continues to grow. Whether it becomes a cornerstone of future food systems or remains a valuable supplement, urban farming has already changed how city dwellers think about the origins of their food.',
'academic', 'medium', 20),

(2, 'The Forgotten Art of Letter Writing',
'Before instant messaging collapsed distance into milliseconds, personal letters were the primary thread connecting people separated by geography. A letter was an event: composed with care, sealed, carried across land and sea, and read, often many times, by its recipient.\n\nHistorians value personal correspondence enormously. Letters reveal the texture of daily life that official records omit: what people ate, feared, joked about, and hoped for. The correspondence between ordinary soldiers and their families during wartime, for instance, has given researchers insights into morale and hardship that no military archive could provide.\n\nThe decline of letter writing began not with the internet but with the telephone. As calls became affordable in the mid-twentieth century, the immediacy of voice replaced the ritual of ink. Email accelerated the shift, and social media completed it. National postal services across the developed world now report that personal letters make up less than five percent of mail volume, with the remainder dominated by parcels and commercial correspondence.\n\nYet the practice refuses to disappear entirely. Stationery sales have risen among younger consumers, and pen-pal programmes report growing memberships. Psychologists suggest the appeal lies in what makes letters inefficient: slowness invites reflection, and physical permanence creates a sense of significance that a disappearing message cannot match. A handwritten letter also carries traces of its author, in the handwriting itself, the choice of paper, even mistakes crossed out rather than deleted.\n\nSchools in several countries have reintroduced letter writing into their curricula, not from nostalgia, but because educators find it teaches structure, audience awareness, and patience. The letter, it seems, may survive precisely because it is slow.',
'general', 'easy', 15),

(3, 'Deep-Sea Mining: Promise and Peril',
'The floor of the deep ocean holds mineral deposits of extraordinary value. Polymetallic nodules, potato-sized lumps scattered across abyssal plains, contain nickel, cobalt, copper, and manganese, the very metals demanded by batteries, wind turbines, and electric vehicles. As the world electrifies, attention has turned to these underwater riches.\n\nProponents argue that deep-sea mining could supply critical minerals with less human harm than terrestrial mining, which has been associated with deforestation, child labour, and toxic waste in several regions. Nodules simply rest on the seabed, requiring collection rather than excavation, and the abyssal plains appear, at first glance, to be sparsely populated deserts.\n\nMarine scientists urge caution. The deep sea is the least explored ecosystem on Earth, and expeditions to nodule fields routinely discover species unknown to science. The nodules themselves take millions of years to form and serve as the only hard surface on vast muddy plains, making them essential habitat for sponges, corals, and the creatures that depend on them. Sediment plumes stirred up by collection vehicles could smother life far beyond the mining site, and the noise and light of industrial operations would intrude into an environment that has known neither.\n\nRegulation remains unsettled. The International Seabed Authority, a United Nations body, has issued exploration contracts covering more than a million square kilometres of ocean floor, yet rules governing commercial extraction are still under negotiation. Several countries and major technology companies have called for a moratorium until the environmental consequences are better understood, while others press ahead, arguing that the climate crisis makes these minerals indispensable.\n\nThe decision facing humanity is stark: whether the transition away from fossil fuels justifies opening a new industrial frontier in the planet''s last untouched wilderness.',
'academic', 'hard', 20),

(4, 'The Science of Sleep',
'Sleep is not merely the absence of wakefulness. It is a complex, highly regulated process during which the brain cycles through distinct stages, each serving critical biological functions. Despite occupying roughly a third of human life, sleep remained poorly understood until the development of electroencephalography in the twentieth century allowed researchers to observe brain activity through the night.\n\nModern sleep science distinguishes two main categories: rapid eye movement (REM) sleep and non-REM sleep, which itself divides into three progressively deeper stages. During non-REM sleep, the brain consolidates declarative memories, those involving facts and events, while the body repairs tissues, strengthens the immune system, and releases growth hormones. REM sleep, characterised by vivid dreaming and near-complete muscular paralysis, appears to play a central role in processing emotions and consolidating procedural memories, such as how to ride a bicycle.\n\nThe consequences of insufficient sleep are well documented and alarming. Chronic sleep deprivation has been linked to obesity, cardiovascular disease, weakened immune function, and impaired cognitive performance. Even modest reductions in sleep duration, losing just one or two hours per night over consecutive nights, produce measurable declines in reaction time, decision-making, and emotional regulation. Studies of shift workers, who frequently disrupt their natural circadian rhythms, show elevated rates of cancer, diabetes, and depression.\n\nDespite the evidence, modern societies are sleeping less than ever. The average adult in industrialised countries now sleeps approximately seven hours per night, down from roughly nine hours a century ago. Artificial lighting, screen exposure, caffeine consumption, and demanding work schedules are the primary culprits. Adolescents are particularly affected: biological changes during puberty shift the circadian clock later, yet school start times rarely accommodate this shift.\n\nSleep researchers advocate several interventions. At the individual level, maintaining a consistent sleep schedule, limiting screen exposure before bed, and reducing caffeine after midday have been shown to improve sleep quality significantly. At the policy level, some countries have begun experimenting with later school start times, and a growing number of corporations have introduced nap rooms and flexible schedules, recognising that well-rested employees are more productive, not less.',
'academic', 'medium', 20),

(5, 'The History of Chocolate',
'Few foods have undergone as dramatic a transformation as chocolate. What began as a bitter, foamy drink consumed by Mesoamerican civilisations over three thousand years ago bears almost no resemblance to the sweet, solid confection enjoyed worldwide today.\n\nThe cacao tree, Theobroma cacao, meaning "food of the gods," is native to the tropical lowlands of Central and South America. The Olmec civilisation is believed to have been the first to cultivate cacao, around 1500 BCE. The Maya later developed elaborate rituals around the drink, mixing ground cacao beans with water, chilli, and cornmeal to create a frothy, spiced beverage reserved for nobility and religious ceremonies. The Aztec empire valued cacao beans so highly that they served as currency; a single turkey could be purchased for one hundred beans.\n\nSpanish conquistadors brought cacao to Europe in the sixteenth century, where it was initially met with suspicion. The bitter taste was unfamiliar to European palates, and some physicians warned that the drink was dangerously stimulating. Within a few decades, however, the addition of sugar and vanilla transformed it into a luxury beverage consumed by aristocrats across the continent. Chocolate houses, precursors to modern coffee shops, became fashionable meeting places in London and Paris.\n\nThe industrialisation of chocolate began in the nineteenth century with several key innovations. In 1828, the Dutch chemist Coenraad van Houten invented a press that separated cocoa butter from the bean, producing a fine powder that dissolved easily in liquid. In 1847, the British company J.S. Fry and Sons created the first solid chocolate bar by combining cocoa powder, sugar, and melted cocoa butter. Swiss manufacturers later perfected milk chocolate and the conching process, which gave chocolate its smooth, melt-in-the-mouth texture.\n\nToday, chocolate is a global industry worth over one hundred billion dollars annually. Yet the supply chain remains controversial. The majority of the world''s cacao is grown in West Africa, where reports of child labour and deforestation have prompted calls for ethical sourcing. Fair trade and direct-trade models aim to ensure that cacao farmers receive a larger share of the profits, though critics argue these schemes reach only a fraction of producers.',
'general', 'easy', 15),

(6, 'Artificial Intelligence and the Future of Work',
'The integration of artificial intelligence into the workplace is no longer a speculative scenario but an accelerating reality. From customer service chatbots to algorithms that screen job applications, AI systems are already performing tasks that were, until recently, the exclusive domain of human workers. The debate over whether this transformation will create more jobs than it destroys remains one of the most consequential economic questions of the twenty-first century.\n\nOptimists point to historical precedent. Every major technological revolution, from the steam engine to the personal computer, initially displaced workers but ultimately created more employment than it eliminated. The mechanisation of agriculture freed labour for manufacturing; the automation of manufacturing freed labour for services. AI, they argue, will follow the same pattern, eliminating routine tasks while creating entirely new categories of work that we cannot yet imagine.\n\nPessimists counter that AI is fundamentally different from previous technologies because it targets cognitive rather than physical labour. A factory robot replaces a pair of hands; an AI system can replace judgement, analysis, and even creativity. Legal research, medical diagnosis, financial analysis, and content creation are already being partially automated. If machines can perform not only manual work but also the intellectual work that professionals have relied upon for high wages, the social consequences could be profound.\n\nThe impact is unlikely to be uniform. Workers in routine, rules-based occupations face the highest risk of displacement, whether they work in offices or on factory floors. Those whose roles demand complex social interaction, creative problem-solving, or physical dexterity in unpredictable environments are, for now, less vulnerable. However, the pace of AI development makes confident predictions hazardous; capabilities that seemed decades away have arrived in years.\n\nGovernments and educators face urgent questions. Retraining programmes must be designed and funded at scale. Education systems need to emphasise skills that complement rather than compete with AI: critical thinking, empathy, ethical reasoning, and the ability to collaborate with intelligent machines. Some economists advocate a universal basic income as a safety net during the transition. Others propose robot taxes, levying charges on companies that automate jobs to fund social programmes.\n\nWhat seems certain is that the relationship between humans and work is about to change in ways that will reshape societies. Managing that change wisely may prove to be the defining policy challenge of the coming decades.',
'academic', 'hard', 25),

(7, 'The Psychology of Colour',
'Colour influences human behaviour in ways that are both obvious and surprisingly subtle. Marketers, interior designers, and psychologists have long studied these effects, yet many everyday responses to colour remain below conscious awareness.\n\nThe psychological impact of colour begins with basic associations shaped by nature and culture. Red, the colour of blood and fire, reliably increases arousal and urgency across cultures. Restaurants use warm reds and oranges to stimulate appetite, while sale signs exploit red''s association with urgency. Blue, associated with the sky and sea, tends to promote calm and trust; it is no coincidence that social media platforms, banks, and healthcare companies overwhelmingly favour blue in their branding.\n\nHowever, colour responses are not universal. White symbolises purity and weddings in many Western cultures but is the traditional colour of mourning in parts of East Asia. Green carries positive associations with nature and growth globally, yet in some South American countries it is linked to illness. These cultural variations complicate any attempt to establish universal rules about colour and emotion.\n\nResearch has revealed some effects that appear consistent across populations. Studies conducted in controlled environments show that exposure to blue light improves alertness and cognitive performance, while warmer tones facilitate relaxation. One widely cited experiment demonstrated that people exercising in rooms painted red perceived their workout as more intense than those in blue rooms, even when the physical demands were identical. Another study found that students given tests printed on red paper performed worse than those whose papers were printed on white or green.\n\nThe applications of colour psychology extend beyond marketing. Hospitals have redesigned waiting areas with calming blues and greens to reduce patient anxiety. Schools have experimented with classroom colours to improve concentration. Urban planners have used colour strategically in public spaces to reduce crime and increase feelings of safety.\n\nCritics caution against oversimplifying the relationship between colour and behaviour. Individual preferences, personal experiences, and context all mediate colour''s effects. A colour that energises in a gym may cause stress in a bedroom. Nevertheless, the evidence that colour shapes mood, perception, and decision-making is robust enough that ignoring it in design decisions would be unwise.',
'general', 'medium', 18),

(8, 'Microplastics: The Invisible Threat',
'Tiny fragments of plastic, most measuring less than five millimetres in diameter, have infiltrated virtually every ecosystem on Earth. Microplastics have been found in Arctic sea ice, in the deepest ocean trenches, in rainwater falling on remote mountain peaks, and, most recently, in human blood and lung tissue. Their presence raises questions that science is only beginning to answer.\n\nMicroplastics originate from two main sources. Primary microplastics are manufactured at small sizes for specific purposes: the microbeads once common in facial scrubs, the plastic pellets used as raw material in manufacturing, and the synthetic fibres shed by polyester and nylon clothing during washing. Secondary microplastics result from the breakdown of larger plastic items, such as bottles, bags, and tyres, degraded by sunlight, wave action, and mechanical abrasion into progressively smaller pieces.\n\nThe environmental consequences are concerning. Marine organisms, from zooplankton to whales, ingest microplastics, which can block digestive tracts, reduce feeding, and transfer toxic chemicals absorbed from surrounding water. Studies have shown that microplastics can accumulate through the food chain, a process called biomagnification, meaning that predators at the top consume higher concentrations than those at the bottom. On land, microplastics have been detected in agricultural soils, where they may affect plant growth and soil-dwelling organisms.\n\nThe human health implications remain uncertain but increasingly alarming. Research published in recent years has detected microplastic particles in human placentas, in the lungs of surgical patients, and in the bloodstream of healthy adults. The long-term effects of this internal exposure are unknown, but laboratory studies suggest that microplastics can trigger inflammatory responses and may carry harmful additives, such as phthalates and bisphenol A, into tissues.\n\nAddressing the microplastic problem requires action at multiple levels. Several countries have banned microbeads in cosmetics, and the European Union is developing restrictions on intentionally added microplastics in a range of products. Wastewater treatment plants can capture a significant proportion of microplastics, but they are not designed to remove the smallest particles. At the source, reducing plastic production and consumption remains the most effective strategy.\n\nThe challenge is immense because plastic is deeply embedded in modern life. From food packaging to medical devices to the clothes people wear, alternatives are not always available, affordable, or environmentally superior. What is clear is that the era of treating plastic as disposable is coming to an end, driven not by choice but by the accumulating evidence of its persistence.',
'academic', 'hard', 22);

-- ---------------------------------------------------------------------
-- Reading questions
-- ---------------------------------------------------------------------
INSERT INTO questions (passage_id, module, question_type, question_text, options_json, correct_answer, explanation, position) VALUES
-- Passage 1: Urban Farming
(1,'reading','mcq','What is the main aim of Singapore''s "30 by 30" initiative?',
 '["To convert 30% of land to farms by 2030","To produce 30% of nutritional needs locally by 2030","To reduce food imports by 30% each year","To build 30 vertical farms by 2030"]',
 'To produce 30% of nutritional needs locally by 2030',
 'Paragraph 3 states the initiative aims "to produce thirty percent of the nation''s nutritional needs locally by 2030". Option A confuses land use with food output, and options C and D are not mentioned.',1),
(1,'reading','true_false_ng','Vertical farms in Singapore use less water than conventional farming.',
 '["True","False","Not Given"]','True',
 'The passage says vertical farms produce greens "with a fraction of the water used in conventional farming", which directly supports the statement.',2),
(1,'reading','true_false_ng','Most staple grains are now grown profitably in indoor farms.',
 '["True","False","Not Given"]','False',
 'The passage states the opposite: profitable indoor crops are "dominated by fast-growing salad vegetables rather than the staple grains".',3),
(1,'reading','mcq','According to critics, what might achieve food security at lower cost than urban farming?',
 '["Reducing energy prices","Growing more salad vegetables","Improving rural supply chains","Expanding community gardens"]',
 'Improving rural supply chains',
 'Paragraph 4: "Some researchers argue that improving rural supply chains would achieve greater food security at lower cost."',4),
(1,'reading','true_false_ng','Investment in urban agriculture has started to decline.',
 '["True","False","Not Given"]','False',
 'The final paragraph says "investment in urban agriculture continues to grow", contradicting the statement.',5),

-- Passage 2: Letter Writing
(2,'reading','mcq','According to the passage, the decline of letter writing began with:',
 '["The internet","Email","The telephone","Social media"]','The telephone',
 'Paragraph 3 states the decline "began not with the internet but with the telephone". Email and social media accelerated and completed the shift, but did not begin it.',1),
(2,'reading','true_false_ng','Personal letters now form the majority of mail handled by postal services.',
 '["True","False","Not Given"]','False',
 'The passage says personal letters make up "less than five percent of mail volume", so they are a small minority.',2),
(2,'reading','mcq','Why do psychologists believe letters still appeal to people?',
 '["They are cheaper than messaging apps","Their slowness and permanence create significance","They are easier to write than emails","They can be delivered faster than before"]',
 'Their slowness and permanence create significance',
 'Paragraph 4 explains that "slowness invites reflection, and physical permanence creates a sense of significance".',3),
(2,'reading','true_false_ng','Schools teach letter writing mainly because of nostalgia.',
 '["True","False","Not Given"]','False',
 'The final paragraph explicitly says schools reintroduced letters "not from nostalgia" but because it teaches structure, audience awareness, and patience.',4),
(2,'reading','true_false_ng','Wartime letters have helped historians understand soldiers'' morale.',
 '["True","False","Not Given"]','True',
 'Paragraph 2 says wartime correspondence "has given researchers insights into morale and hardship".',5),

-- Passage 3: Deep-Sea Mining
(3,'reading','mcq','Polymetallic nodules are valuable mainly because they contain:',
 '["Oil and natural gas","Metals used in batteries and turbines","Rare fossils of unknown species","Materials for building ships"]',
 'Metals used in batteries and turbines',
 'Paragraph 1 lists nickel, cobalt, copper and manganese as "the very metals demanded by batteries, wind turbines, and electric vehicles".',1),
(3,'reading','true_false_ng','Nodules can be collected without digging into the seabed.',
 '["True","False","Not Given"]','True',
 'Paragraph 2 says nodules "simply rest on the seabed, requiring collection rather than excavation".',2),
(3,'reading','mcq','Why do marine scientists consider nodules ecologically important?',
 '["They release nutrients into the water","They are the only hard surface on the muddy plains","They protect the seabed from sediment","They attract commercially valuable fish"]',
 'They are the only hard surface on the muddy plains',
 'Paragraph 3 explains nodules "serve as the only hard surface on vast muddy plains, making them essential habitat".',3),
(3,'reading','true_false_ng','Rules for commercial deep-sea extraction have already been finalised.',
 '["True","False","Not Given"]','False',
 'The passage states that rules "are still under negotiation", so they have not been finalised.',4),
(3,'reading','true_false_ng','All technology companies support an immediate start to deep-sea mining.',
 '["True","False","Not Given"]','False',
 'Paragraph 4 says several countries and major technology companies "have called for a moratorium", so not all support proceeding.',5),

-- Passage 4: The Science of Sleep
(4,'reading','mcq','What type of memories does non-REM sleep primarily consolidate?',
 '["Procedural memories","Emotional memories","Declarative memories","Sensory memories"]',
 'Declarative memories',
 'Paragraph 2 states that during non-REM sleep "the brain consolidates declarative memories, those involving facts and events".',1),
(4,'reading','true_false_ng','REM sleep involves active physical movement of the body.',
 '["True","False","Not Given"]','False',
 'The passage says REM sleep is "characterised by vivid dreaming and near-complete muscular paralysis", not physical movement.',2),
(4,'reading','mcq','According to the passage, what has happened to average sleep duration over the past century?',
 '["It has remained stable","It has increased by two hours","It has decreased by approximately two hours","It has become more variable"]',
 'It has decreased by approximately two hours',
 'The passage states adults now sleep "approximately seven hours per night, down from roughly nine hours a century ago" — a decrease of about two hours.',3),
(4,'reading','true_false_ng','Adolescents'' biological clocks shift earlier during puberty.',
 '["True","False","Not Given"]','False',
 'The passage states "biological changes during puberty shift the circadian clock later", not earlier.',4),
(4,'reading','mcq','Which of the following is NOT mentioned as a cause of reduced sleep in modern societies?',
 '["Artificial lighting","Genetic changes","Caffeine consumption","Screen exposure"]',
 'Genetic changes',
 'The passage lists "artificial lighting, screen exposure, caffeine consumption, and demanding work schedules" as causes. Genetic changes are not mentioned.',5),
(4,'reading','true_false_ng','Some corporations have introduced nap rooms for employees.',
 '["True","False","Not Given"]','True',
 'The final paragraph says "a growing number of corporations have introduced nap rooms and flexible schedules".',6),

-- Passage 5: The History of Chocolate
(5,'reading','mcq','Which civilisation is believed to have first cultivated cacao?',
 '["The Maya","The Aztecs","The Olmec","The Spanish"]',
 'The Olmec',
 'Paragraph 2 states "The Olmec civilisation is believed to have been the first to cultivate cacao, around 1500 BCE."',1),
(5,'reading','true_false_ng','In the Aztec empire, cacao beans were used as a form of currency.',
 '["True","False","Not Given"]','True',
 'Paragraph 2 says "The Aztec empire valued cacao beans so highly that they served as currency."',2),
(5,'reading','mcq','What made chocolate palatable to European tastes?',
 '["Removing the caffeine","Adding sugar and vanilla","Mixing it with milk","Roasting it longer"]',
 'Adding sugar and vanilla',
 'Paragraph 3 says "the addition of sugar and vanilla transformed it into a luxury beverage."',3),
(5,'reading','true_false_ng','The first solid chocolate bar was created in Switzerland.',
 '["True","False","Not Given"]','False',
 'The passage says "the British company J.S. Fry and Sons created the first solid chocolate bar", not a Swiss company.',4),
(5,'reading','mcq','What concern about the chocolate industry is mentioned in the final paragraph?',
 '["Declining quality of chocolate","Reports of child labour in cacao farming","Rising prices for consumers","Shortage of cacao trees"]',
 'Reports of child labour in cacao farming',
 'The final paragraph mentions "reports of child labour and deforestation" as controversies in the supply chain.',5),

-- Passage 6: AI and the Future of Work
(6,'reading','mcq','What do optimists about AI in the workplace rely on to support their argument?',
 '["Government regulations","Historical precedent of technology creating jobs","Predictions from AI researchers","Current employment statistics"]',
 'Historical precedent of technology creating jobs',
 'Paragraph 2 says "Optimists point to historical precedent. Every major technological revolution... ultimately created more employment than it eliminated."',1),
(6,'reading','true_false_ng','Pessimists argue that AI is different because it targets cognitive labour.',
 '["True","False","Not Given"]','True',
 'Paragraph 3 states "AI is fundamentally different from previous technologies because it targets cognitive rather than physical labour."',2),
(6,'reading','mcq','Which type of workers faces the highest risk of displacement by AI?',
 '["Those in creative roles","Those in routine, rules-based occupations","Healthcare professionals","Manual labourers in construction"]',
 'Those in routine, rules-based occupations',
 'Paragraph 4 says "Workers in routine, rules-based occupations face the highest risk of displacement."',3),
(6,'reading','true_false_ng','All economists agree that universal basic income is the best solution.',
 '["True","False","Not Given"]','False',
 'The passage says "Some economists advocate a universal basic income" while "Others propose robot taxes" — there is no consensus.',4),
(6,'reading','mcq','What skills does the passage suggest education should emphasise?',
 '["Technical programming skills","Skills that complement rather than compete with AI","Traditional academic knowledge","Physical and manual skills"]',
 'Skills that complement rather than compete with AI',
 'Paragraph 5 says "Education systems need to emphasise skills that complement rather than compete with AI: critical thinking, empathy, ethical reasoning."',5),
(6,'reading','true_false_ng','The author believes the impact of AI on work will be easy to manage.',
 '["True","False","Not Given"]','False',
 'The author calls it "the defining policy challenge of the coming decades", suggesting it will be difficult, not easy.',6),
(6,'reading','true_false_ng','AI has already been used to screen job applications.',
 '["True","False","Not Given"]','True',
 'Paragraph 1 mentions "algorithms that screen job applications" as an existing use of AI.',7),

-- Passage 7: The Psychology of Colour
(7,'reading','mcq','Why do restaurants frequently use warm reds and oranges in their design?',
 '["To appear expensive","To stimulate appetite","To match their logos","To attract younger customers"]',
 'To stimulate appetite',
 'Paragraph 2 says "Restaurants use warm reds and oranges to stimulate appetite."',1),
(7,'reading','true_false_ng','Colour associations are the same across all cultures.',
 '["True","False","Not Given"]','False',
 'Paragraph 3 gives examples of cultural variation — white means mourning in parts of East Asia but purity in the West.',2),
(7,'reading','mcq','In the exercise experiment mentioned, people in red rooms:',
 '["Exercised longer","Felt the workout was more intense","Performed better","Burned more calories"]',
 'Felt the workout was more intense',
 'Paragraph 4 says "people exercising in rooms painted red perceived their workout as more intense."',3),
(7,'reading','true_false_ng','Students performed better on tests printed on red paper.',
 '["True","False","Not Given"]','False',
 'The passage says "students given tests printed on red paper performed worse", not better.',4),
(7,'reading','mcq','What do critics caution about colour psychology?',
 '["It has no scientific basis","Its effects are often oversimplified","It only works in marketing","It is too expensive to implement"]',
 'Its effects are often oversimplified',
 'The final paragraph says "Critics caution against oversimplifying the relationship between colour and behaviour."',5),
(7,'reading','true_false_ng','Hospitals have used colour to reduce patient anxiety.',
 '["True","False","Not Given"]','True',
 'Paragraph 5 says "Hospitals have redesigned waiting areas with calming blues and greens to reduce patient anxiety."',6),

-- Passage 8: Microplastics
(8,'reading','mcq','Which of the following is an example of a primary microplastic?',
 '["A broken plastic bottle","A degraded shopping bag","Microbeads in facial scrubs","Fragments from car tyres"]',
 'Microbeads in facial scrubs',
 'Paragraph 2 says primary microplastics are "manufactured at small sizes for specific purposes" and lists "the microbeads once common in facial scrubs."',1),
(8,'reading','true_false_ng','Microplastics have been found in human blood.',
 '["True","False","Not Given"]','True',
 'Paragraph 1 says they have been found "in human blood and lung tissue" and paragraph 4 confirms "in the bloodstream of healthy adults."',2),
(8,'reading','mcq','What is biomagnification?',
 '["The process by which plastic breaks down","The accumulation of pollutants through the food chain","The growth of microplastic production","The magnification used to study microplastics"]',
 'The accumulation of pollutants through the food chain',
 'Paragraph 3 says "microplastics can accumulate through the food chain, a process called biomagnification."',3),
(8,'reading','true_false_ng','Wastewater treatment plants can remove all microplastics from water.',
 '["True","False","Not Given"]','False',
 'The passage says plants "can capture a significant proportion" but "are not designed to remove the smallest particles."',4),
(8,'reading','mcq','According to the passage, what is the most effective strategy for tackling microplastics?',
 '["Building better wastewater plants","Banning all plastic products","Reducing plastic production and consumption","Developing biodegradable plastics"]',
 'Reducing plastic production and consumption',
 'Paragraph 5 says "reducing plastic production and consumption remains the most effective strategy."',5),
(8,'reading','true_false_ng','Microplastics have been detected in agricultural soils.',
 '["True","False","Not Given"]','True',
 'Paragraph 3 says "microplastics have been detected in agricultural soils."',6),
(8,'reading','true_false_ng','Alternatives to plastic are always cheaper and more environmentally friendly.',
 '["True","False","Not Given"]','False',
 'The final paragraph says "alternatives are not always available, affordable, or environmentally superior."',7),
(8,'reading','mcq','Where have microplastics NOT been found, according to the passage?',
 '["Arctic sea ice","Human placentas","The Earth''s core","Remote mountain peaks"]',
 'The Earth''s core',
 'The passage mentions Arctic sea ice, human placentas, and remote mountain peaks. The Earth''s core is never mentioned.',8);

-- ---------------------------------------------------------------------
-- Vocabulary (band 6-9 academic words — 80+ words across diverse categories)
-- ---------------------------------------------------------------------
INSERT INTO vocabulary (word, meaning, synonyms, antonyms, example_sentence, pronunciation, category, band_level) VALUES
-- Academic
('ubiquitous','Present, appearing, or found everywhere','omnipresent, pervasive, universal','rare, scarce','Smartphones have become ubiquitous in modern society.','/juːˈbɪkwɪtəs/','academic','8'),
('mitigate','To make something less severe or harmful','alleviate, reduce, lessen','aggravate, worsen','Planting trees can mitigate the effects of urban heat.','/ˈmɪtɪɡeɪt/','environment','7'),
('exacerbate','To make a problem or situation worse','aggravate, intensify, worsen','alleviate, improve','Traffic congestion is exacerbated by poor city planning.','/ɪɡˈzæsəbeɪt/','academic','8'),
('resilient','Able to recover quickly from difficulties','tough, adaptable, hardy','fragile, vulnerable','Coastal communities must become more resilient to flooding.','/rɪˈzɪliənt/','environment','7'),
('paradigm','A typical example or model of something','model, framework, pattern','anomaly','Remote work represents a new paradigm in employment.','/ˈpærədaɪm/','academic','8'),
('scrutinise','To examine something very carefully','inspect, examine, analyse','ignore, overlook','Voters should scrutinise the promises of every candidate.','/ˈskruːtɪnaɪz/','academic','7'),
('detrimental','Causing harm or damage','harmful, damaging, adverse','beneficial, helpful','Excessive screen time can be detrimental to sleep quality.','/ˌdetrɪˈmentl/','health','7'),
('proliferation','A rapid increase in number or amount','spread, expansion, multiplication','decline, decrease','The proliferation of online courses has widened access to education.','/prəˌlɪfəˈreɪʃn/','education','8'),
('unprecedented','Never done or known before','unparalleled, extraordinary, novel','common, ordinary','The pandemic caused unprecedented disruption to global travel.','/ʌnˈpresɪdentɪd/','academic','7'),
('feasible','Possible to do easily or conveniently','achievable, viable, practical','impossible, impractical','Solar power is now economically feasible for many households.','/ˈfiːzəbl/','technology','7'),
('advocate','To publicly support or recommend','support, champion, promote','oppose, discourage','Many doctors advocate a balanced diet over supplements.','/ˈædvəkeɪt/','general','7'),
('discrepancy','A difference between things that should be the same','inconsistency, mismatch, gap','consistency, agreement','Auditors found a discrepancy between the two financial reports.','/dɪsˈkrepənsi/','academic','8'),
('inevitable','Certain to happen; unavoidable','unavoidable, certain, inescapable','avoidable, uncertain','Some job losses are inevitable as automation spreads.','/ɪnˈevɪtəbl/','general','7'),
('meticulous','Showing great attention to detail','thorough, careful, precise','careless, sloppy','The researcher kept meticulous records of every experiment.','/məˈtɪkjələs/','academic','8'),
('pragmatic','Dealing with things sensibly and realistically','practical, realistic, sensible','idealistic, impractical','A pragmatic approach to recycling focuses on what people will actually do.','/præɡˈmætɪk/','general','8'),
('surge','A sudden powerful increase','spike, rise, upsurge','decline, drop','There has been a surge in demand for electric vehicles.','/sɜːdʒ/','economics','7'),
('curtail','To reduce or restrict something','reduce, limit, restrict','expand, increase','New regulations aim to curtail plastic waste.','/kɜːˈteɪl/','environment','8'),
('empirical','Based on observation or experience rather than theory','observed, evidence-based, experimental','theoretical, hypothetical','The study provides empirical evidence linking exercise to memory.','/ɪmˈpɪrɪkl/','academic','9'),

-- Society & Culture
('assimilate','To absorb and integrate into a wider culture or group','integrate, absorb, adapt','reject, segregate','Immigrants often face challenges as they assimilate into a new society.','/əˈsɪmɪleɪt/','society','8'),
('demographic','Relating to the structure of a population','population-related, statistical','individual','The demographic shift toward an ageing population affects healthcare policy.','/ˌdeməˈɡræfɪk/','society','7'),
('egalitarian','Believing in or based on equality for all people','equal, fair, democratic','elitist, hierarchical','The country''s constitution promotes an egalitarian society.','/ɪˌɡælɪˈteəriən/','society','9'),
('marginalise','To treat a person or group as insignificant','exclude, sideline, alienate','include, empower','Policies that marginalise minority communities undermine social cohesion.','/ˈmɑːdʒɪnəlaɪz/','society','8'),
('indigenous','Originating or occurring naturally in a place','native, original, aboriginal','foreign, imported','Indigenous communities have protected these forests for centuries.','/ɪnˈdɪdʒɪnəs/','society','7'),
('secular','Not connected with religious or spiritual matters','non-religious, worldly, temporal','religious, sacred','Many Western nations have adopted a secular model of governance.','/ˈsekjʊlə/','society','8'),
('altruistic','Showing selfless concern for the well-being of others','selfless, philanthropic, charitable','selfish, egocentric','Her altruistic work in refugee camps earned international recognition.','/ˌæltruˈɪstɪk/','society','9'),

-- Technology
('autonomous','Operating independently without human control','self-governing, independent, automated','dependent, manual','Autonomous vehicles are being tested in several major cities.','/ɔːˈtɒnəməs/','technology','8'),
('algorithm','A set of rules or steps used to solve a problem','procedure, formula, method','manual process','Social media platforms use algorithms to personalise content feeds.','/ˈælɡərɪðəm/','technology','7'),
('encryption','The process of converting data into code for security','coding, ciphering, encoding','decryption','End-to-end encryption protects messages from being read by third parties.','/ɪnˈkrɪpʃn/','technology','8'),
('obsolete','No longer in use; outdated','outdated, antiquated, defunct','modern, current','Rapid innovation makes today''s devices obsolete within a few years.','/ˈɒbsəliːt/','technology','7'),
('bandwidth','The capacity for data transfer in a network','capacity, throughput','limitation, constraint','Limited bandwidth in rural areas restricts access to online education.','/ˈbændwɪdθ/','technology','7'),
('cyber','Relating to computers, networks, and the internet','digital, online, virtual','offline, physical','Cyber security has become a top priority for governments worldwide.','/ˈsaɪbə/','technology','6'),

-- Education
('curriculum','The subjects comprising a course of study','syllabus, programme, coursework','extracurricular','The national curriculum has been revised to include digital literacy.','/kəˈrɪkjʊləm/','education','7'),
('pedagogy','The method and practice of teaching','instruction, teaching methods, didactics','self-teaching','Modern pedagogy emphasises active learning over passive lectures.','/ˈpedəɡɒdʒi/','education','9'),
('cognitive','Relating to the mental processes of perception and learning','mental, intellectual, cerebral','physical','Cognitive development in early childhood shapes future academic success.','/ˈkɒɡnɪtɪv/','education','8'),
('rote','Mechanical or habitual repetition as a learning method','memorisation, repetition, drilling','understanding, comprehension','Critics argue that rote learning discourages creative thinking.','/rəʊt/','education','7'),
('literacy','The ability to read and write; competence in a specific area','reading ability, education, competence','illiteracy','Digital literacy is now considered as essential as traditional literacy.','/ˈlɪtərəsi/','education','6'),
('truancy','The act of staying away from school without permission','absenteeism, skipping, absence','attendance','Schools have implemented new strategies to reduce truancy rates.','/ˈtruːənsi/','education','7'),
('vocational','Relating to skills needed for a particular job','occupational, professional, trade-based','academic','Vocational training programmes help students prepare for the workforce.','/vəʊˈkeɪʃənl/','education','7'),

-- Health
('sedentary','Involving much sitting and little physical activity','inactive, desk-bound, stationary','active, mobile','A sedentary lifestyle increases the risk of heart disease.','/ˈsedntri/','health','7'),
('epidemic','A widespread occurrence of a disease in a community','outbreak, plague, pandemic','containment','The obesity epidemic is linked to changes in diet and physical activity.','/ˌepɪˈdemɪk/','health','7'),
('chronic','Persisting for a long time or constantly recurring','long-term, persistent, ongoing','acute, temporary','Chronic stress can lead to a weakened immune system.','/ˈkrɒnɪk/','health','7'),
('immunisation','The process of making a person immune to infection','vaccination, inoculation','infection, exposure','Childhood immunisation has dramatically reduced deaths from preventable diseases.','/ˌɪmjʊnaɪˈzeɪʃn/','health','7'),
('diagnosis','The identification of a disease or condition','identification, detection, assessment','misdiagnosis','Early diagnosis of cancer significantly improves survival rates.','/ˌdaɪəɡˈnəʊsɪs/','health','7'),
('holistic','Considering the whole person, not just symptoms','comprehensive, integrated, complete','narrow, reductionist','A holistic approach to healthcare considers mental and physical well-being together.','/həʊˈlɪstɪk/','health','8'),
('rehabilitation','The process of restoring health or normal life after illness','recovery, restoration, therapy','deterioration','Rehabilitation programmes help patients regain mobility after surgery.','/ˌriːəˌbɪlɪˈteɪʃn/','health','7'),

-- Economics
('inflation','A general increase in prices and fall in purchasing value','price rise, cost increase','deflation','Rising inflation has eroded the purchasing power of low-income families.','/ɪnˈfleɪʃn/','economics','7'),
('subsidy','Financial assistance given by the government','grant, funding, support','tax, penalty','Agricultural subsidies help farmers compete in the global market.','/ˈsʌbsɪdi/','economics','7'),
('austerity','Difficult economic conditions created by reduced spending','belt-tightening, cutbacks, frugality','prosperity, abundance','Austerity measures led to widespread public protests.','/ɒˈsterɪti/','economics','8'),
('fiscal','Relating to government revenue, especially taxes','financial, monetary, budgetary','non-financial','Fiscal policy must balance economic growth with debt management.','/ˈfɪskl/','economics','8'),
('tariff','A tax on imported or exported goods','duty, levy, import tax','subsidy','Higher tariffs on steel imports affected manufacturing costs.','/ˈtærɪf/','economics','7'),
('monopoly','Exclusive control of a commodity or service','dominance, control','competition','Some argue that major tech companies operate as virtual monopolies.','/məˈnɒpəli/','economics','7'),
('deficit','The amount by which spending exceeds income','shortfall, loss, debt','surplus','The government is under pressure to reduce its budget deficit.','/ˈdefɪsɪt/','economics','7'),
('entrepreneurship','The activity of setting up new businesses','enterprise, innovation, business creation','employment, conformity','Entrepreneurship is encouraged through grants and tax incentives.','/ˌɒntrəprəˈnɜːʃɪp/','economics','8'),

-- Environment (additional words)
('biodiversity','The variety of plant and animal life in a habitat','biological diversity, variety of life','monoculture','Deforestation is one of the greatest threats to biodiversity.','/ˌbaɪəʊdaɪˈvɜːsɪti/','environment','7'),
('sustainability','Meeting present needs without compromising future generations','viability, durability, renewability','unsustainability','Sustainability is now a core principle in urban development.','/səˌsteɪnəˈbɪləti/','environment','7'),
('deforestation','The clearing of forests for non-forest use','forest clearance, logging','reforestation, afforestation','Deforestation in the Amazon has accelerated in recent years.','/diːˌfɒrɪˈsteɪʃn/','environment','7'),
('emissions','The production and discharge of gases or radiation','discharge, output, pollution','absorption','Carbon emissions from transport are a major contributor to climate change.','/ɪˈmɪʃnz/','environment','6'),
('conservation','Preservation of natural resources and the environment','preservation, protection, stewardship','destruction, exploitation','Wildlife conservation efforts have helped restore endangered species.','/ˌkɒnsəˈveɪʃn/','environment','7'),
('renewable','Capable of being replenished naturally','sustainable, inexhaustible, green','non-renewable, finite','The shift toward renewable energy sources is gaining momentum worldwide.','/rɪˈnjuːəbl/','environment','6'),
('erosion','The gradual wearing away of soil or rock','wearing away, degradation, deterioration','accumulation, build-up','Coastal erosion threatens homes and infrastructure in many regions.','/ɪˈrəʊʒn/','environment','7'),

-- Law & Crime
('jurisdiction','The official power to make legal decisions','authority, domain, territory','exemption','The case falls under federal jurisdiction rather than state law.','/ˌdʒʊərɪsˈdɪkʃn/','law','8'),
('deterrent','Something that discourages an action or behaviour','discouragement, disincentive, obstacle','incentive, encouragement','Supporters of the death penalty argue that it serves as a deterrent.','/dɪˈterənt/','law','7'),
('litigation','The process of taking legal action in court','lawsuit, legal proceedings, prosecution','settlement, mediation','The cost of litigation can be prohibitive for small businesses.','/ˌlɪtɪˈɡeɪʃn/','law','8'),
('rehabilitation','The restoration of offenders to a useful life in society','reform, reintegration, correction','punishment, incarceration','Some justice systems prioritise rehabilitation over punishment.','/ˌriːəˌbɪlɪˈteɪʃn/','law','7'),
('censorship','The suppression of speech, communication, or information','suppression, restriction, banning','freedom of expression','Online censorship raises concerns about freedom of speech.','/ˈsensəʃɪp/','law','7'),

-- Science
('hypothesis','A proposed explanation based on limited evidence','theory, assumption, proposition','fact, proof','The scientist tested her hypothesis through a series of controlled experiments.','/haɪˈpɒθɪsɪs/','science','7'),
('synthesis','The combining of separate elements to form a whole','combination, integration, fusion','analysis, separation','The synthesis of new materials has revolutionised engineering.','/ˈsɪnθɪsɪs/','science','8'),
('phenomenon','A fact or event that can be observed','occurrence, event, happening','normality','Global warming is a phenomenon supported by decades of data.','/fɪˈnɒmɪnən/','science','7'),
('correlation','A mutual relationship between two or more things','connection, association, link','independence','There is a strong correlation between poverty and poor health outcomes.','/ˌkɒrəˈleɪʃn/','science','8'),
('causation','The relationship between cause and effect','cause, origin, source','coincidence','Correlation does not imply causation, a principle often misunderstood in media reporting.','/kɔːˈzeɪʃn/','science','8'),
('specimen','An individual example of an animal, plant, or mineral','sample, example, model','whole, entirety','The museum holds over ten thousand botanical specimens.','/ˈspesɪmɪn/','science','7'),

-- Media & Communication
('propaganda','Biased information used to promote a point of view','misinformation, spin, manipulation','truth, objectivity','Wartime propaganda shaped public opinion through posters and radio broadcasts.','/ˌprɒpəˈɡændə/','media','7'),
('sensationalism','The use of exciting content to provoke interest','exaggeration, hype, dramatisation','understatement, restraint','Tabloid sensationalism can distort public understanding of complex issues.','/senˈseɪʃənəlɪzm/','media','8'),
('bias','Prejudice in favour of or against one thing or group','prejudice, partiality, favouritism','impartiality, fairness','Media bias can influence public perception of political events.','/ˈbaɪəs/','media','6'),
('transparency','The quality of being open and honest','openness, clarity, accountability','secrecy, opacity','Government transparency is essential for maintaining public trust.','/trænsˈpærənsi/','media','7'),
('viral','Spreading rapidly through the internet','trending, widespread','obscure','The campaign video went viral, reaching millions of viewers within hours.','/ˈvaɪrəl/','media','6'),

-- General / Abstract
('ambiguous','Open to more than one interpretation','unclear, vague, equivocal','clear, unambiguous','The contract contained several ambiguous clauses that led to disputes.','/æmˈbɪɡjuəs/','general','7'),
('tangible','Clear and definite; able to be perceived by touch','concrete, palpable, real','abstract, intangible','The project has not yet produced any tangible results.','/ˈtændʒəbl/','general','8'),
('innate','Inborn; natural rather than learned','natural, inherent, inborn','acquired, learned','Some researchers believe musical ability is partly innate.','/ɪˈneɪt/','general','8'),
('nuance','A subtle difference in meaning or expression','subtlety, distinction, shade','bluntness, simplicity','The nuances of the argument were lost in the heated debate.','/ˈnjuːɑːns/','general','9'),
('paradox','A seemingly contradictory statement that may be true','contradiction, anomaly, puzzle','consistency','The paradox of choice suggests that more options can lead to less satisfaction.','/ˈpærədɒks/','general','8'),
('apathy','Lack of interest, enthusiasm, or concern','indifference, disinterest, lethargy','passion, enthusiasm','Voter apathy is a growing concern in many democracies.','/ˈæpəθi/','general','8'),
('dilemma','A situation requiring a choice between equally undesirable options','predicament, quandary, difficulty','solution','The ethical dilemma of genetic engineering continues to divide opinion.','/dɪˈlemə/','general','7'),
('eloquent','Fluent and persuasive in speaking or writing','articulate, expressive, persuasive','inarticulate, tongue-tied','Her eloquent speech moved the entire audience to tears.','/ˈeləkwənt/','general','8'),
('hierarchy','A system in which people are ranked according to status','ranking, order, structure','equality','The rigid hierarchy in the workplace stifled innovation.','/ˈhaɪərɑːki/','general','7'),
('superficial','Existing on the surface; lacking depth','shallow, surface-level, cursory','deep, thorough','A superficial understanding of the issue led to poor decision-making.','/ˌsuːpəˈfɪʃl/','general','7');


-- ---------------------------------------------------------------------
-- Listening module seeds
-- ---------------------------------------------------------------------
INSERT INTO listening_tests (title, audio_url, transcript, difficulty, time_limit) VALUES
('Section 1: Library Membership', 'https://upload.wikimedia.org/wikipedia/commons/2/23/En-uk-listening.ogg', 'LIBRARIAN: Good morning, Northleigh Library. How can I help you?\nMAN: Yes, I’d like to join the library, please.\nLIBRARIAN: Certainly. Can I just get some details from you? What’s your full name?\nMAN: Peter... Peter Smith.', 'easy', 10),
('Section 2: Campus Tour', 'https://upload.wikimedia.org/wikipedia/commons/2/23/En-uk-listening.ogg', 'GUIDE: Welcome everyone to the University of Westbridge campus tour. We will start here at the main building and then head over to the science labs.', 'medium', 10);

INSERT INTO questions (listening_test_id, module, question_type, question_text, options_json, correct_answer, explanation, position) VALUES
(1, 'listening', 'mcq', 'What is the man''s name?', '["Peter Smith", "John Smith", "Peter Jones", "Paul Smith"]', 'Peter Smith', 'The man explicitly states his name is Peter Smith when asked.', 1),
(1, 'listening', 'fill_blank', 'The man wants to join the ________.', NULL, 'library', 'He says "I''d like to join the library, please."', 2),
(2, 'listening', 'mcq', 'Where does the campus tour start?', '["Science labs", "Main building", "Library", "Cafeteria"]', 'Main building', 'The guide states: "We will start here at the main building".', 1),
(2, 'listening', 'fill_blank', 'After the main building, they will visit the ________.', NULL, 'science labs', 'The guide says they will "head over to the science labs".', 2);
-- Test student account
INSERT INTO users (name, email, password_hash) VALUES ('Test User', 'test@example.com', '$2a$10$xiXEl/jHEGh8np75t.bngOCvxpWf8TSX1yJni3FqnXoqXb04iCUcq');
INSERT INTO profiles (user_id) VALUES (LAST_INSERT_ID());

-- Admin account: admin@bandup.com / Admin@123
INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin@bandup.com', '$2a$12$t37kVn.rHkijlLMNbW1WzuOs7xFIwb.xKbA6zHA3l2DDdnIdkWT/6', 'admin');
INSERT INTO profiles (user_id) VALUES (LAST_INSERT_ID());
INSERT INTO writing_prompts (task_type, category, prompt_text, chart_data) VALUES
('task1', 'Academic Test 1', 'The chart below shows the number of men and women in further education in Britain in three periods and whether they were studying full-time or part-time. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.', '{
  \"type\": \"bar\",
  \"data\": {
    \"labels\": [\"1970/71\", \"1980/81\", \"1990/91\"],
    \"datasets\": [
      { \"label\": \"Men Full-time\", \"data\": [100, 150, 200], \"backgroundColor\": \"#3b82f6\" },
      { \"label\": \"Men Part-time\", \"data\": [1000, 850, 950], \"backgroundColor\": \"#60a5fa\" },
      { \"label\": \"Women Full-time\", \"data\": [80, 120, 250], \"backgroundColor\": \"#ec4899\" },
      { \"label\": \"Women Part-time\", \"data\": [750, 800, 1050], \"backgroundColor\": \"#f472b6\" }
    ]
  },
  \"options\": {
    \"responsive\": true,
    \"scales\": {
      \"y\": { \"beginAtZero\": true, \"title\": { \"display\": true, \"text\": \"Thousands\" } }
    }
  }
}'),
('task2', 'Academic Test 1', 'Some people believe that university education should be free for everyone. Others think that students should pay for their higher education. Discuss both these views and give your own opinion. Give reasons for your answer and include any relevant examples from your own knowledge or experience.', NULL),
('task1', 'General Training Test 1', 'You recently stayed at a hotel and had a problem with the service. Write a letter to the hotel manager. In your letter: state when you stayed there, explain the problem, and suggest what the hotel should do.', NULL),
('task2', 'General Training Test 1', 'In many countries, the amount of crime is increasing. What do you think are the main causes of this? What can be done to reduce crime rates? Give reasons for your answer and include any relevant examples from your own knowledge or experience.', NULL);
