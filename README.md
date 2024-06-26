# TableTop Role-Playing Game Discord Bot

Disclaimer: I am not and do not claim to be an owner of any of the below TableTop Role-Playing Game modules or any of the media relating to the content they are based on. All media and designed systems are the trademarks/copyright of their original owners.

# Project Summary

The TableTop Role-Playing Game Discord Bot (TTRPG Bot) is an application designed to function as a companion for any type of tabletop roleplaying game being run through the social platform Discord. This open-source discord bot was built with a modular framework intended for giving developers a baseline for building off of for use in many varying types of asynchronous/synchronous tabletop role-playing games. There are built-in baselines for characters, inventories, combat and other types of common aspects necessary for most tabletop roleplaying games. The project is built upon a strongly-typed TypeScript Framework using DiscordJS intended to be used with a live MySQL Database. The project is occasionally hosted publicly on an Oracle Cloud Infrastructure (OCI) instance, though the service is often unreliable so the below instructions go off the assumption that the hosting is being done by the reader.

Currently this project has two example modules, as shown below:

## Pokeymanz TableTop RPG Module

Pokeymanz is a fan-made Pokémon RPG made to be simple and easy to pick up. It was made to be less mechanically dense like other Pokémon TableTop RPGs, which are often made to reflect the mechanical depth of the video games. Pokemanz was made with a stronger emphasis on roleplaying similar to how the anime/manga function.

This module is still currently in active development and currently only includes the storage of trainers/characters and Pokémon lookup via the [PokéAPI RESTful API](https://pokeapi.co/). Specifically, Pokémon data is obtained for lookup using the API's GraphQL beta in order to reduce query time, amount, and complexity. This lookup feature allows players to easily lookup Pokémon and both abilities or moves related to these Pokémon in order to make adding Pokémon to your inventory easier. It is also useful for obtaining their weakenesses for combat encounters.

All material originally created specifically for the Pokeymanz TTRPG belongs to ChronicDelusionist and the other creators behind the Pokeymanz TableTop RPG. This work was created under the knowledge and understanding that the Pokeymanz work is freely able to be remixed/altered by other parties and in following with that this module and bot itself are similarly able to be freely remixed/altered by others who see fit in-keeping with the tenants of open-source development.

A link to the Pokemanz website can be found [here](https://chronicdelusionist.neocities.org/Pokeymanz/).

## Danganronpa TTRPG Module

As stated in the rules, this role-playing game is based of off the Danganronpa series, where players are meant to create multiple characters and live together in a less-than-ideal school life. Each character should have a specialization in a specific field, gaining them exclusive skills to aid them in everyday life or in generating conflict in the terms of the regular murder mysteries that occur during the game. The game also have a built-in trial system meant for facilitating deliberation of the murder mysteries among the characters and players.

This module is mainly completed in terms of development and is receiving less specific feature updates due to having features already that covers most of the system. The module currently allows for storing characters, character skills, character relationships, and trial truth bullets. As stated previously, trials also function within the system built upon the standard initiative system as well as including things such as turn interrupts, using truth bullets as justification, user-specific truth bullet viewability, and guilty voting functionality.

A link to the rules for the Danganronpa TTRPG can be found [here](https://docs.google.com/document/d/1tMuyTbdFTPbpgg_nzw_qtMb9eTComTYA1NZZqngIEVA/edit?usp=sharing).

# Quick Start Guide

## Discord Bot & Discord Bot Account

Create an account on the [Discord Developer Portal](https://discord.com/developers). Then create a Discord Bot Application and make sure to keep the token for the application safe for later since it will be used in the .env file. It is recommended to create two bot applications, one for testing and one for standard deployment so that they can both be up and running simultaneously. This makes it easier to work on updates while the bot is up and usable for users, then allowing for a quick application of these updates to the live environment.

## MySQL Instance

The process of setting up a MySQL instance will not be covered here, but resources available for setting up an instance can be found [here](https://dev.mysql.com/doc/mysql-getting-started/en/).

## .env File

The .env file contains a lot of fields that should not be shared with others or affect the configuration of the application. The .env file should be placed in the top-level directory of the application and provided with specific fields. Below shows the valid fields of the .env file.

### Valid Fields

-   TOKEN _[REQUIRED]_ - Token generated for discord bot generated upon creation of discord bot application.
-   HOST _[Defaults to "localhost"]_ - Hostname of the server where database is being stored.
-   USER _[REQUIRED]_ - Username of the database user intended to access the database through.
-   PASSWORD - Password of the database user described in the USER field on the host HOST.
-   DATABASE _[REQUIRED]_ - Name of the database used in the MySQL instance.
-   TESTGUILD - ID of the Discord Server (Guild) intended for testing. Obtained by right-clicking on a Discord Server and clicking Copy Server ID. Only required when testing mode is active.
-   MODE _[Options: test - any string/undefined value]_ - Establishes whether or not the bot will be running in test mode or not. Test mode allows for the bot to update/add/delete commands much quicker but requires the specification of a test-guild in the TESTGUILD field for it to function.

## Installation/Setup

### **Installing Node Modules**

```
npm i
```

### **Running the Application**

```
ts-node .\startup.ts
```

Or if ts-node is not installed globally

```
npx ts-node .\startup.ts
```

NOTE: Most functionality will not work if a came for the current server is not created. Make sure to create a game in the server you are in before attempting to test any functionality.

# Adding A Module

When adding a module, best practices dictate that you should try to only edit the files labelled with the prefix "custom". These files were made to be edited by developers who wish to add additonal functionality and that this additonal functionality does not get lost within the standard bot functionality. Make sure to always properly export the structures created at the bottom of each file you create and extended parent classes where applicable. it is highly encouraged to heavily reference the example modules during the process of development in case the documentation is in anyway unclear to you.

## Setup

Most custom modules are found nested within the modules folder. It is recommended to create a custom module folder in a similar structure to one of the example modules, having a setup file and subfolders for custom interpreters, utility functions, models, and media.

### /modules/module_defs.ts

Editing this file is simple, just add the object definition for your module within the defs array in the file. The format is as follows:

```typescript
{name: '[Module Name]', value: '[2-3 Letter Module Identifier]'}
```

### Custom Setup file

This is the file where commands are created and defined, this will be called when the bot is started so that all commands can be registered by discord. Most commands follow a similar structure, based on the structure found within the interpreters/models. For example, a command called **character** may have sub-commands called **add**, **remove**, or **edit** which will generate the following commands: **character-add**, **character-remove**, and **character-edit**. The reason we use subcommands instead of commands is because it is better for organization and helps with reducing the amount of commands to stay well under the 100 command limit.

Command setup often looks similar to the following:

```typescript
commands?.create({
	name: '[Command Name (i.e. character)]',
	description: '[Command Description]',
	options: [
		{
			name: '[Subcommand 1 Name (i.e. add)]',
			description: '[Subcommand 1 Description]',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
			{
				name: '[String Required Field Name]',
				description: '[String Required Field Description]',
				required: true,
				type: ApplicationCommandOptionType.String
			},
			...,
			{
				name: '[Numerical Optional Field Name]',
				description: '[Numerical Optional Field Description]',
				required: false,
				type: ApplicationCommandOptionType.Number
			}]
		},
		...,
		{
			name: '[Subcommand 2 Name (i.e. edit)]',
			description: '[Subcommand 2 Description]',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
			{
				name: '[String Required Choice Field Name]',
				description: '[String Required Choice Field Description]',
				required: true,
				type: ApplicationCommandOptionType.String,
				choices: [
					{name: '[Choice Name 1]', value: 1},
					{name: '[Choice Name 2]', value: 2},
				]
			},
			...,
			{
				name: '[Numerical Optional Field Name]',
				description: '[Numerical Optional Field Description]',
				required: false,
				type: ApplicationCommandOptionType.Number
			}]
		}]
	}
```

Commands can be required or optional for users to enter based on the boolean value of the required field. There are also many different types of input fields for subcommands, accessed through the **ApplicationCommandOptionType** enum, more info can be found [here](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type). You can also add subcommands with choices, which can provide arbritrary return values based on what works for your use case.

### /modules/custom_setup.ts

Once the setup file has been created and configured, make sure to add the following two lines to the custom_setup.ts file. These will allow the bot to call your custom setup files during startup.

```typescript
import { SetupName } from "./modulename/modulename.setup";

SetupName.setup(commands);
```

### Custom Bridge File

The bridge file is one of the most integral for the lifecycle of the application as it allows for true customization with modules as well as a bridge to each interpeter function to be called. The most common methods of a typical bridge file are as follows:

#### Constructor

This constructor will often be used to call the constructor of the parent class **Bridge.** The main thing you will be concerned with in the constructor is adding disabled commands or overriden commands. Disabled commands are basic commands from the standard implementation you would not like to function in your bot. For example, if I wasn't running a tabletop roleplaying game that required initiative I could disabled the init command and all of its subcommands so that players wouldn't be able to use the command. Overriden commands are used so that basic subcommands from the standard implementation will till function via your overwritten implementation. This prevents you from having to do any additional work to re-implement these functions. For more technical details on implementing these, see the sections about them below.

#### getCharacter

The getCharacter function is meant for use in situations where you have generated a module-specific character type and want to use that over the basic character type. This is useful because it allows you to not have to redefine the basic functions provided to you that will not need to change and will work automatically with your new character type out of the box. The standard body of a getCharacter function appears as follows:

```typescript
return await NameCharacter.getCharacter(
    this.gamedb,
    this.tableNameBase,
    char_name
);
```

#### initializeTables

The initializeTables function essentially runs all of your startup commands, such as initializing each of your MySQL tables and loading all initial data from things like CSVs. It is recommended to either create createTable methods in each of your database model classes and call them all here or to create one big query to create them all at once and put that here.

#### parse

The parse method is used to act as the actual custom bridge for your bridge file. This function should first check to make sure what command is being called (i.e. character, inventory, roll) and then call the proper interpreter based on what command is called (i.e. CharacterInterpreter or InventoryInterpreter). I also tend to put calls for input fields that are called by all of the functions in an interpreter in here and pass them in as parameters to all the interpreter functions, but this is not a requirement. From there you should determine which subcommand is being called (i.e. add, remove, view) and use that to call the proper interpreter function. A sample parse method is shown below:

```typescript
if (commandName === "character") {
    const chrInterpreter = new CharacterInterpreter(
        gamedb,
        tableNameBase,
        options,
        client,
        interaction
    );
    const charName = UtilityFunctions.formatString(
        options.getString("char-name", true)
    );
    switch (subcommandName) {
        case "add":
            return await chrInterpreter.add(charName);
        case "remove":
            return await chrInterpreter.remove(charName);
        case "view":
            return await chrInterpreter.view(charName, bridge);
        case "change-stat":
            return await chrInterpreter.changeStat(charName);
    }
} else if (commandName === "inventory") {
    const invInterpreter = new InventoryInterpreter(
        gamedb,
        tableNameBase,
        options,
        client,
        interaction
    );
    const chrName = UtilityFunctions.formatString(
        options.getString("char-name", true)
    );
    switch (subcommandName) {
        case "modify":
            return await invInterpreter.modify(chrName, bridge);
        case "view":
            if (activeGame == null) {
                return "Issue retrieving active game.";
            }
            return await invInterpreter.view(chrName, bridge, activeGame);
    }
}
```

### /modules/select_interpreter.ts

Once your custom bridge file has been created, you must now add a few lines to the select_interpreters file so that the bot knows which module's bridge to call when attempting to lookup a command. Add a case to the switch-case similar to the below code (Make sure to use the same identifier as the value in module_defs.ts):

```typescript
case '[2-3 Letter Module Identifier]':
	return new NameBridge(gamedb, tableNameBase);
```

### Custom Interpreter

Creating interpreter functions is mainly up to you in what functionality you desire each command/subcommand to achieve. This part is pretty open-ended and can be taken in any way the reader desires. You can use the sample interpreters provided in order to get a baseline for expected practices for interpreter functions if needed.

### Database Models

A model file often represents a specific table or group of related tables within the database schema. These models often have methods in order to interact with these tables, such as createTable to create the table, get functions to obtain data from the table(s), and embed viewing functions in order to view a summary of a specific thing from the table or of the table itself. Similar to interpreter these database are open-ended and specific to the type of application you wish to create. If you are still confused, it is recommended to use the example models provided to give a baseline in how to create a database model.

## Disabling a Command

Disabling a command should follow a very specific process as established by the definition of a DisableCommand within the abstract_models file. This process should be performed if you want to ignore a built-in implementation and instead use your own implementation of a function. An example of this, which should be found within your custom bridge file, is as follows:

```typescript
this.disabledCmds = [
    new DisabledCommand(
        "character",
        new Map<string, string>([["add", "dr-character add-character"]])
    ),
    new DisabledCommand(
        "init",
        new Map<string, string>([
            ["begin", "dr-trial begin"],
            ["end", "dr-trial end"],
            ["add", "dr-trial add-character"],
        ])
    ),
];
```

In the above example, we are attempting to disable the **character add** command and instead direct users to the **dr-character add-character** command. This means the "character add" command will not be able to be used and will direct users to use the "dr-character add-character" command instead.

The above example also shows trying to replace multiple subcommands of a command at once for the **init** command, which functions as intended and directs users to each command specified in the second string within each element of the mapping.

## Overriding a Command

Overriding a command should follow a very specific process as established by the definition of a OverrideCommand within the abstract_models file. This process should be performed if you want to keep functionality the same for specific subcommands of a command that has disabled. An example of this, which should be found within your custom bridge file, is as follows:

```typescript
this.overridenCmds = [
    new OverridedCommand("character", "dr-character"),
    new OverridedCommand("init", "dr-trial"),
];
```

The above example allows functions using the **character** or **init** commands to still work even on **dr-character** or **dr-trial** respectively. For example, since remove and view functions are already implemented for "character" and don't need to be changed at all to work with "dr-character", I now do not re-implement them to be used with the "dr-character command". This has been done because, for example, it may confuse some users to use the "character" command for deleting and viewing but the separate "dr-character" command for adding.

## Common Utility Functions Provided

### Database

#### Connect

Allows the user to connect to a database instance given a hostname, database name, username, and password.

#### Disconect

Allows the user to disconnect from a database instance given the SQL connection presumably generated by the connect function.

### General

#### errorCheck

Given a condition, checks if that condition is true or false. If the condition is true, the function throws an error.

Mainly used to make error checking more visually distinct and take up less lines in code.

#### parseRoll

Parses a roll given to the bot as input through a rolling command. Is able to parse any mathematical expression provided which includes only die format, numerical constants, and operators. Die format is expressed in the form **XdY** where **X** is the number of rolls and **Y** is the amount of faces/sides on the dice. For example, to roll three standard six-sided die you would format it as 3d6 in dice format. If number of rolls is not specified, than it will default to 1 (i.e. d20 = 1d20). Valid operators include addition [+], subtraction [-], multiplication [*], division [/], integer division [//], modulo/remainder [%], parenthesis [()], and exponents [^]. Currently also has additional features such as advantage, disadvantage, retaining the top N dice, retaining the bottom N dice, and exploding dice implemented.

(3d20 / 2) + 2d6 - ((5 \* 2d3) + 5)

8d6 / 2

2d20 \* (3d6 + 1)

1d20adv

d8dis + 2d8e8

20d20b10 \* (2 + 3d8t2)

#### getEmojiID

Parses the emoji ID from the input of a discord emoji delineator and returns it. Works for both custom server emojis and standard emoji.

#### getEmoteDisplay

Obtains the Discord emoji display for an emoji regardless of the emoji is a custom discord emoji or a standard one.

#### getRandomNum

Randomly generates a number between one and the supplied cieling, inclusive.

#### scrambleString

Takes a string as input and then scrambles the characters of the string to provide a string made up of the same characters but in a different order. Is meant for use in puzzles, but may have various use cases. Works recursively.

#### formatString

Formats and sanitizes the input of a string inputted by the user that is from a required field. The sanitization is performed in order to prevent SQL Injection Attacks.

#### formatNullString

Formats and sanitizes the input of a string inputted by the user that is from an optional field. The sanitization is performed in order to prevent SQL Injection Attacks.

#### getMessage

Returns a discord text message sent in a discord server. Requires the discord server ID, text channel ID, and message ID.

#### parseColumns, parseColStr, parseMultStr

Various methods used to parse different ways of inputting custom SQL data into a table. Is not meant for use and only exists to aid users who wish to set up a game without adding any additional hardcoded support. Is most likely open to SQL Injection Attacks.

### Pagination

#### createButtons

Internal function used to make the buttons for going to the next page or previous page. Can be edited/tweaked/built-upon for various differing button functionality.

#### getPaginatedMessage

Creates a message that functions as a paginated message using the next and previous buttons. Will fill the page with the requested paginated data and store it until the timeout period is reached, in which the paginated page will stop functioning.

### Voice

#### playAudio

Streams the audio file provided to the voice channel through the bot via audio player.

#### setIdleDisconnect

Sets the bot to disconnect from the channel on its own if the audio player is idle for a specified duration of time.

#### getConnection

Connects to a specificied voice channel and then enters the ready state within the voice channel.
