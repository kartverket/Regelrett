# Provision Regelrett

Regelrett has an active provisioning system that uses configuration files.
This makes GitOps more natural since data sources and dashboards can be defined using files that can be version controlled.

## Configuration file

Refer to [Configuration](../README.md) for more information on what you can configure in `conf/custom.yaml`.

### Configuration file locations

Regelrett reads its default configuration from `<WORKING DIRECTORY>/conf/defaults.yaml`.
By default, Regelrett reads custom configuration from `<WORKING DIRECTORY>/conf/custom.yaml`.
~~You can override the custom configuration path with the `--config` option.~~

### Use environment variables

You can use environment variable lookups in all provisioning configuration.
The syntax for an environment variable is `$ENV_VAR_NAME`.

<!-- If the environment variable value has a `$` in it (for example, `Pa$sw0rd`), use the `$ENV_VAR_NAME` syntax to avoid double expansion. -->
<!-- You can only use environment variables for configuration values and not for keys or bigger parts of the configuration file structure. -->

You can use environment variables in schema provisioning configuration but not the schema definition files themselves.

The following example looks up the data source URL port, user, and password using environment variables:

```yaml
schema_sources:
  - name: Skjemanavn
    url: http://localhost:$PORT
    user: $USER
    secureJsonData:
      password: $PASSWORD
```

~~To escape a literal `$` in your provisioning file values, use `$$`.~~

## Schema sources

You can manage schema sources in Regelrett by adding YAML configuration files in the [`provisioning/schemasources`](../README.md#provisioning) directory.
Each configuration file contains a list of schema sources, under the `schemasources` key, to add ~~or update~~ during startup.
~~If the schema source already exists, Regelrett reconfigures it to match the provisioned configuration file.~~

<!-- Dette blir relevant om kildene lagres i en database -->
<!-- ~~You can also list schema sources to automatically delete, using the key `deleteschemasources`. -->
<!-- Regelrett deletes the schema sources listed in `deleteschemasources` _before_ adding or updating those in the `schemasources` list.~~ -->
<!---->
<!-- ~~You can configure Regelrett to automatically delete provisioned schema sources when they're removed from the provisioning file. -->
<!-- To do so, add `prune: true` to the root of your schema source provisioning file. -->
<!-- With this configuration, Regelrett also removes the provisioned schema sources if you remove the provisioning file entirely.~~ -->

### Example schema source configuration file

This example provisions a Airtable schema source:

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
    # <int> Sets the version. Used to compare versions when
    # updating. Ignored when creating a new schema source.
    version: 1
    # <string> Sets the data source's URL, including th
    # port.
    url: "https://api.airtable.com"
    ##### Additional parameters for specifying Airtable schema #####
    ##### sources.                                             #####
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
    view_id: unique_table_id
    # <string, optional, for Airtable schema sources> Specify
    # a webhook id and secret to allow Airtable to notify
    # Regelrett of changes to the data.
    webhook_id: exampleid
    # <string, optional, for Airtable schema sources>
    webhook_secret: S3cr3t!
    ##### Additional parameters for specifying Yaml schema     #####
    ##### sources.                                             #####
    # Either url or resourcePath must be set
    # <string, optional, for Yaml schema sources> Path to a Yaml
    # schema source relative to project resources.
    resource_path: /schemas/schema1
```
### Schema structure
While the schema structure is flexible, regelrett enforces certain requirements regarding format and required fields.

A schema of type YAML should follow the structure outlined below.


#### name
Required, Specifies the name of the Schema.

#### columns
Defines the columns of the schema.

Each column must include:

`name`: The name of the column

`type`: The column type. Supported values: OPTION_MULTIPLE, OPTION_SINGLE and TEXT

For columns of type OPTION_MULTIPLE and OPTION_SINGLE, you may also define:
- `options`: A list of allowed values
- `color`: A color associated with each option
This restricts the possible inputs for all records in that column.

Important:
The answer column must be named "svar"
It must be the third column (index 3) in the column definition

#### Records
Represents the rows of the schema. Each record contains data corresponding to all defined columns. Each record must include:

`id` : A unique identifier for the record.
This value is not visible to the user, but the same value should also be inserted into a corresponding ID column.

`metadata`: Contains metadata related to the record’s answer, as well as optional configuration.

`answerMetadata`: Defines how the answer for the record should be handled. Contains the following fields:

- `Type`: Required, select the type of this records answer, select between: `SELECT_MULTIPLE`,`SELECT_SINGLE`, `TEXT_MULTI_LINE`, `TEXT_SINGLE_LINE`, `PERCENT`, `CHECKBOX`, `TIME`

- `Unit`: Optional, List of strings - specefy units of the answers.

- `expiry`: Optional, int - set number of weeks an answer is valid, until it is flagged as expired in Regelrett

`optionalFields`: Defines values for each column in the record.
Each key must correspond to a column name
Each value represents the data for that column in the given record


```yaml
name: "YAML-data" 
columns: 
  - type: "OPTION_SINGLE"  #Choose between OPTION_MULTIPLE, OPTION_SINGLE or TEXT
    name: "Kortnavn" #Column name
  - type: "OPTION_SINGLE"
    name: "ID" #ID columns should always be included in every Schema. 
  - type: "OPTION_SINGLE"
    name: "Kontroller"
  - type: "OPTION_SINGLE"
    name: "Svar"
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