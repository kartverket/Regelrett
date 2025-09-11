# Configure Regelrett

Features that are planned but not implemented are indicated by ~~strikethroughs~~.

Regelrett has default and custom configuration files.
You can customize your Regelrett instance by modifying the custom configuration file or by using environment variables.

> After you add custom options, [uncomment](#remove-comments-in-the-yaml-files) the relevant sections of the configuration file.
>
> Restart Regelrett for your changes to take effect.

## Configuration file location

The default settings for a Regelrett instance are stored in the `<WORKING DIRECTORY>/conf/defaults.yaml` file.
_Don't_ change this file.

Your custom configuration file is the `<WORKING DIRECTORY>/conf/custom.yaml` file.
~~You can use a custom configuration path with the `--config` option.~~

The sample.yaml file is located in the same directory as defaults.yaml file.
It contains all the settings commented out. Copy sample.yaml and name it custom.yaml.

### ~~Docker~~

~~Refer to [Configure a Regelrett Docker image]() for information about environmental variables, persistent storage, and building custom Docker images.~~

## Remove comments in the .yaml files

Yaml uses hashtags (`#`) to comment out lines in the yaml file.
To uncomment a line, remove the hashtag (`#`) from the beginning of that line.

Regelrett ignores all configuration lines that begin with a hashtag.

For example:

```yaml
#http_port = 3000
```

## Override configuration with environment variables

Don't use environment variables to _add_ new configuration settings.
Instead, use environmental variables to _override_ existing options.

To override an option:

```bash
RR_<SECTION NAME>_<KEY>
```

Where _`<SECTION NAME>`_ is the top level keys in configuration file.
All letters must be uppercase, periods (`.`) and dashes (`-`) must replaced by underscores (`_`).
For example, if you have these configuration settings:

```yaml
base:
  environment: production

server:
  http_port: 8080

schema_sikkerhetskontroller:
  webhook_id: myid

oauth:
  client_secret: s3cret
```

You can override variables on Linux machines with:

```bash
export RR_BASE_ENVIRONMENT=development
export RR_SERVER_HTTP_PORT=owner
export RR_SCHEMA_SIKKERHETSKONTROLLER_WEBHOOK_ID=newid
export RR_OAUTH_CLIENT_SECRET=newS3cretKey
```

## ~~Variable expansion~~

~~If any of your options contains the expression `$__<PROVIDER>{<ARGUMENT>}`or `${<ENVIRONMENT VARIABLE>}`, then Regelrett evaluates them.
The evaluation runs the provider with the provided argument to get the final value of the option.~~

~~There are two providers: `env` and `file`.~~

### ~~`env` provider~~

~~The `env` provider expands environment variables.
If you set an option to `$__env{PORT}` the value of the `PORT` environment variable replaces it.
For environment variables you can also use the short-hand syntax `${PORT}`.~~

~~The following example sets the log directory to the path in the `LOGDIR` environment variable:~~

```yaml
paths:
  logs: $__env{LOGDIR}/regelrett
```

### ~~`file` provider~~

~~The `file` provider reads a file from the filesystem.
It trims whitespace from the beginning and the end of files.~~

~~The following example sets the database password to the contents of the `/etc/secrets/gf_sql_password` file:~~

```yaml
database:
  password: $__file{/etc/secrets/gf_sql_password}
```

## Configuration options

The following headings describe the sections and configuration options of the Regelrett configuration file.

### `base`

#### `environment`

Options are `production` and `development`. Default is `production`.
_Don't_ change this option unless you are working on Regelrett development.

### `server`

#### `http_port`

The port the api server binds to, defaults to `8080`.

#### `http_addr`

The host for the server to listen on.
If your machine has more than one network interface, you can use this setting to expose the Regelrett service on only one network interface and not have it available on others, such as the loopback interface.
An the default value is `0.0.0.0`, which means the Regelrett service binds to all interfaces.

In environments where network address translation (NAT) is used, ensure you use the network interface address and not a final public address; otherwise, you might see errors such as `bind: cannot assign requested address` in the logs.

#### `domain`

The domain name used to access Regelrett from a browser. Important if you use GitHub or Google OAuth (for the callback URL to be correct).

> This setting is also important if you have a reverse proxy in front of Regelrett that exposes it through a sub-path.
>
> In that case add the sub-path to the end of this URL setting.

#### `router_logging`

Set to `true` for Regelrett to log all HTTP requests (not just errors). These are logged as Info level events to the Regelrett log.

#### `external_service_timing`

Enable timing and debug logging for external service calls (Airtable, Microsoft Graph)

#### `allowed_origins`

The `allowed_origins` option is a comma-separated list of additional origins that is accepted by the Regelrett server.

### `paths`

#### `provisioning`

Directory that contains [provisioning](provisioning/README.md) configuration files that Regelrett applies on startup. ~~Schemas are reloaded when the JSON files change.~~

### schema_sources

### `airtable`

#### `base_url`

The base url of the airtable instance to use as a schema source. Default is `https://api.airtable.com`

### `schema_<schema_name>`

Hard coded source specifications, indicating the individual schemas that should be loaded.

Every schema source specification includes the following fields:

#### `id`

A unique identifier used to locate the source.

#### `type`

Either `AIRTABLE` or `YAML`

In addition airtable schema source specifications include the following fields:

#### `airtable_access_token`

#### `base_id`

#### `table_id`

#### `view_id`

#### `webhook_id`

#### `webhook_secret`

Yaml schema source specifications include the following fields:

#### `endpoint`

#### `resource_path`

### `microsoft_graph`

#### `base_url`

The base url for microsofts graph service. Default is `https://graph.microsoft.com`

#### `member_of_path`

The endpoint to evaluate a users group membership. Default is `/v1.0/me/memberof/microsoft.graph.group`

### `oauth`

#### `base_url`

The base url for the oauth provider. Default is `https://login.microsoftonline.com`

#### `tenant_id`

An Azure tenant identifier. The user should be a member of at the tenant to log in.

#### `issuer_path`

The OAuth 2.0 / OIDC issuer URL of the Microsoft Entra ID authority.

#### `auth_path`

Authorization endpoint of the Azure AD/Entra ID OAuth2 provider.

#### `token_path`

Endpoint used to obtain the OAuth2 access token.

#### `jwks_path`

Used to retrieve the public keys that are specific to a particular tenant and application.

#### `client_id`

Client ID of the App (Application (client) ID on the App registration dashboard).

#### `client_secret`

Client secret of the App.

#### `super_user_group`

Users belonging to the group with this ID will have elevated access to the Regelrett instance.

### `database`

#### `host`

Includes IP or hostname and port. For example, for Postgres running on the same host as Regelrett: host = 127.0.0.1:5432

#### `name`

The name of the Regelrett database. Leave it set to regelrett or some other name.

#### `user`

The database user

#### `password`

The database user's password. If the password contains `#`, `:` or `-` you have to wrap it with quotes. For example "#password"

#### `max_idle_conn`

The maximum number of connections in the idle connection pool.

#### `max_open_conn`

The maximum number of open connections to the database.

#### `conn_max_lifetime`

Sets the maximum amount of time a connection may be reused. The default is 14400 (which means 14400 seconds or 4 hours).

#### `migration_locking`

Set to false to disable database locking during the migrations. Default is true.

#### `locking_attempt_timeout_sec`

Specify the time, in seconds, to wait before failing to lock the database for the migrations. Default is 0.

#### `log_queries`

Set to true to log the SQL calls and execution times.

### `answer_history_cleanup`

#### `cleanup_interval_weeks`

The duration after which older answers will be purged from the database. Only the 3 most recent answers will remain for each question in each instance of each form.
