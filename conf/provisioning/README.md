# Provision Regelrett

Regelrett has an active provisioning system that uses yaml files.
This makes GitOps more natural since schema sources can be defined using files that can be version controlled.
Provisioning in this app is used to tell Regelrett where to find the schemas, which are used to create the contexts the user will fill out.
## Configuration file

Refer to [Configuration](../README.md) for more information on what you can configure in `conf/custom.yaml`.

### Configuration file locations

Regelrett reads its default configuration from `<WORKING DIRECTORY>/conf/defaults.yaml`.
By default, Regelrett reads custom configuration from `<WORKING DIRECTORY>/conf/custom.yaml`.


### Use environment variables

You can use environment variable lookups in all provisioning configuration.
The syntax for an environment variable is `$ENV_VAR_NAME`.

<!-- If the environment variable value has a `$` in it (for example, `Pa$sw0rd`), use the `$ENV_VAR_NAME` syntax to avoid double expansion. -->
<!-- You can only use environment variables for configuration values and not for keys or bigger parts of the configuration file structure. -->

You can use environment variables in schema provisioning configuration but not the schema definition files themselves.

The following example looks up the Airtable access token using an environment variable:

```yaml
schemasources:
  - name: Sikkerhetskontrollere
    type: AIRTABLE
    access_token: $RR_AIRTABLE_ACCESS_TOKEN
    base_id: unique_base_id
    table_id: unique_table_id
```


## Schema sources

You can manage schema sources in Regelrett by adding YAML configuration files in the [`provisioning/schemasources`](../README.md#provisioning) directory.
Each configuration file contains a list of schema sources, under the `schemasources` key, to add during startup.


<!-- Dette blir relevant om kildene lagres i en database -->
<!-- ~~You can also list schema sources to automatically delete, using the key `deleteschemasources`. -->
<!-- Regelrett deletes the schema sources listed in `deleteschemasources` _before_ adding or updating those in the `schemasources` list.~~ -->
<!---->
<!-- ~~You can configure Regelrett to automatically delete provisioned schema sources when they're removed from the provisioning file. -->
<!-- To do so, add `prune: true` to the root of your schema source provisioning file. -->
<!-- With this configuration, Regelrett also removes the provisioned schema sources if you remove the provisioning file entirely.~~ -->

### Example schema source configuration file

This example provisions an Airtable schema source:

```yaml
schemasources:
  # <string, required> Sets the name you use to refer to
  # the schema source in panels and queries.
  - name: Sikkerhetskontrollere
    # <AIRTABLE | YAML, required> Sets the schema source type.
    type: AIRTABLE
    # <string> Sets a custom UID to reference this
    # schema source in other parts of the configuration.
    # If not specified, Regelrett generates one.
    uid: my_unique_uid
    # <string> Sets the data source's URL, including the
    # port.
    url: "https://api.airtable.com"
    ##### Additional parameters for specifying Airtable schema #####
    ##### sources.                                             #####
    # <string, required, for Airtable schema sources> Personal
    # access token (PAT) used to authenticate against the
    # Airtable API. Typically injected as an environment variable.
    access_token: $RR_AIRTABLE_ACCESS_TOKEN
    # <string, required, for Airtable schema sources> Specifies
    # the base to which the specified table belongs.
    base_id: unique_base_id
    # <string, required, for Airtable schema sources> Specifies
    # the id to identify the relevant table in requests to the
    # Airtable api.
    table_id: unique_table_id
    # <string, optional, for Airtable schema sources> The name
    # or ID of a view in the table. If set, only the records
    # in that view will be returned.
    view_id: unique_view_id
    # <string, optional, for Airtable schema sources> Specify
    # a webhook id and secret to allow Airtable to notify
    # Regelrett of changes to the data.
    webhook_id: exampleid
    # <string, optional, for Airtable schema sources>
    webhook_secret: S3cr3t!
    # <string, optional, for Airtable schema sources> The name of the
    # AirTable field that holds the answer options for each record.
    # Defaults to "Svar".
    answer_column: Svar
    # <string, optional, for Airtable schema sources> The name of the
    # AirTable field that holds the answer type (e.g. SELECT_SINGLE).
    # Defaults to "Svartype".
    answer_type_column: Svartype
    # <string, optional, for Airtable schema sources> The name of the
    # AirTable field that holds the answer units (e.g. ms, sek).
    # Defaults to "Svarenhet".
    answer_unit_column: Svarenhet
    # <string, optional, for Airtable schema sources> The name of the
    # AirTable field that holds the answer expiry in weeks.
    # Defaults to "Svarvarighet".
    answer_expiry_column: Svarvarighet
    # <string, optional, for Airtable schema sources> The name of the
    # AirTable field to use as the name/title column. The name/title
    # column is rendered as a clickable link navigating to the question
    # detail page. Defaults to "Navn".
    name_column: Navn
    # <string, optional, for Airtable schema sources> The name of the
    # AirTable field to use as the description column. The description
    # is displayed in the question detail page. If not set, no description
    # will be shown.
    description_column: Sikkerhetskontroller
```

This example provisions a YAML schema source:

```yaml
# <string, required> Sets the name you use to refer to
  # the schema source in panels and queries.
  - name: KI-pilot
    # <AIRTABLE | YAML, required> Sets the schema source type.
    type: YAML
    # <string> Sets a custom UID to reference this
    # schema source in other parts of the configuration.
    # If not specified, Regelrett generates one.
    uid: my_unique_uid2
    ##### Additional parameters for specifying Yaml schema     #####
    ##### sources.                                             #####
    # Either resourcePath or url (not yet working) must be set
    # <string, optional, for Yaml schema sources> Path to a Yaml
    # schema source relative to project resources.
    resource_path: /schemas/schema1
```

## YAML schema structure
While the schema structure is flexible, Regelrett enforces certain requirements regarding format and required fields when creating your YAML schema.
The YAML schema should be placed in `src/main/resources/questions`. [TestQuestions.yaml](../../src/main/resources/questions/testQuestions.yaml) provides a full example of a YAML schema.

A schema of type YAML should follow the structure outlined below.


#### name
Required, Specifies the name of the Schema.

#### columns
Defines the columns of the schema.

Each column must include:

`name`: The name of the column

`type`: The column type. Supported values: `OPTION_MULTIPLE`, `OPTION_SINGLE` and `TEXT`. Note that the column type describes the *shape* of the column; the actual input widget for answering a question is controlled by `answerMetadata.type` on each record (see below).

Each column may also include:

`answerable`: Set to `true` on exactly one column to mark it as the answer column. This column receives special treatment: it is populated from stored answers rather than record metadata, and is used for answer-based sorting and filtering. If no column is marked `answerable`, Regelrett defaults to looking for a column named `"Svar"`.

`isName`: Set to `true` on exactly one column to mark it as the name/title column. This column is rendered as a **clickable link** in the table, navigating to the question detail page. If no column is marked `isName`, no column will be clickable.

> **Note for AirTable schemas:** `answerable` and `isName` are set automatically based on `answer_column` and `name_column` in the provisioning config — you do not set them in AirTable data.

For columns of type `OPTION_MULTIPLE` and `OPTION_SINGLE`, you may also define:
- `options`: A list of allowed values
- `color`: A color associated with each option (see [`app/utils/colors.ts`](../../app/utils/colors.ts) for the full list of valid color names, e.g. `orangeDark1`, `greenBright`)

This restricts the possible inputs for all records in that column.


#### Records
Represents the rows of the schema. Each record contains data corresponding to all defined columns. Each record must include:

`id`: A unique identifier for the record.
This value is not visible to the user, but the same value should also be repeated as the value of the record's `"ID"` column (see the example below) so that it is available in the rendered table.

`question`: The question text shown to the user on the question detail page. This supports Markdown formatting.

`metadata`: Contains metadata related to the record's answer, as well as optional configuration.

`answerMetadata`: Defines how the answer for the record should be handled. Contains the following fields:

- `type`: Required. The input widget used for this record's answer. One of: `SELECT_MULTIPLE`, `SELECT_SINGLE`, `TEXT_MULTI_LINE`, `TEXT_SINGLE_LINE`, `PERCENT`, `CHECKBOX`, `TIME`.

  > **Note:** column `type` (`OPTION_SINGLE`, `OPTION_MULTIPLE`, `TEXT`) describes the answerColumn's shape, while `answerMetadata.type` (`SELECT_SINGLE`, `TEXT_SINGLE_LINE`, …) picks which input component is rendered per record.

- `options`: Required for `SELECT_SINGLE`/`SELECT_MULTIPLE`. A list of allowed answer values for this specific record.

- `units`: Optional. A list of strings — specifies the units the answer can be given in (e.g. `["ms", "sek"]`).

- `expiry`: Optional. Integer — number of weeks an answer is valid before it is flagged as expired in Regelrett.

`optionalFields`: Defines values for each column in the record.
Each key must correspond to a column name.
Each value represents the data for that column in the given record.

Example of a complete YAML schema:

```yaml
name: "YAML-data" 
columns: 
  - type: "TEXT"  #Choose between OPTION_MULTIPLE, OPTION_SINGLE or TEXT
    name: "Kortnavn" #Column name
    isName: true  # This column will be the name/title and clickable link in the table
  - type: "TEXT"
    name: "ID" #ID columns should always be included in every Schema. 
  - type: "TEXT"
    name: "Kontroller"
  - type: "OPTION_SINGLE"
    name: "Svar"
    answerable: true  # This column holds answers
  - type: "OPTION_SINGLE"
    name: "Priority"
    options: #Specifies the options for the entire column, meaning you can not override these options in the record specifications.
      - name: "MÅ" 
        color: "orangeDark1" #choose a color to go with this option throughout the entire column.
      - name: "KAN"
        color: "greenBright"
records:
  - id: "Z-420" #Mandatory recordID, not visible to user.
    question: "How many countries are there in the world?" 
    metadata:
      answerMetadata:
        type: "SELECT_SINGLE" #Sets this question's type to be a single-select drop-down menu with following options.
        options: 
          - "180"
          - "190"
          - "195"
          - "205"
        expiry: 12 # An answer to this question expires in 12 weeks and user will see notification for this
      optionalFields:
        - key: "ID"
          value:
            - "Z-420"
        - key: "Kontroller"
          value:
            - "How many countries are there in the world?"
        - key: "Kortnavn"
          value:
            - "Antall land"
        - key: "Priority"
          value:
            - "MÅ"

```