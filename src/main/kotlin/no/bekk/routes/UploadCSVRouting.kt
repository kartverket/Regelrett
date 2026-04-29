package no.bekk.routes

import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import no.bekk.authentication.AuthService
import no.bekk.configuration.Database
import no.bekk.exception.AuthorizationException
import no.bekk.exception.DatabaseException
import no.bekk.plugins.ErrorHandlers
import no.bekk.services.FormService
import no.bekk.services.FormsMetadataDto
import no.bekk.util.RequestContext.getRequestInfo
import org.slf4j.LoggerFactory
import java.io.StringWriter
import java.sql.ResultSet
import java.sql.SQLException
import java.util.*

private val logger = LoggerFactory.getLogger("no.bekk.routes.UploadCSVRouting")

fun Route.uploadCSVRouting(authService: AuthService, formService: FormService, database: Database) {
    route("/dump-csv") {
        get {
            try {
                logger.info("${call.getRequestInfo()} Received GET /dump-csv")

                if (!authService.hasSuperUserAccess(call)) {
                    logger.warn("${call.getRequestInfo()} Unauthorized access attempt to CSV dump")
                    throw AuthorizationException("Superuser access required for CSV dump")
                }

                val csvData = getLatestAnswersAndComments(database)
                val csv = csvData.toCsv()

                val fileName = "data.csv"
                call.response.header(
                    HttpHeaders.ContentDisposition,
                    ContentDisposition.Attachment.withParameter(ContentDisposition.Parameters.FileName, fileName).toString(),
                )

                logger.info("${call.getRequestInfo()} Successfully generated CSV dump with ${csvData.size} records")
                call.respondBytes(
                    bytes = csv.toByteArray(Charsets.UTF_8),
                    contentType = ContentType.Text.CSV.withCharset(Charsets.UTF_8),
                )
            } catch (e: AuthorizationException) {
                ErrorHandlers.handleAuthorizationException(call, e)
            } catch (e: Exception) {
                logger.error("${call.getRequestInfo()} Error generating CSV dump", e)
                ErrorHandlers.handleGenericException(call, e)
            }
        }
        get("/progress") {
            try {
                logger.info("${call.getRequestInfo()} Received GET /dump-csv/Progress")

                if (!authService.hasSuperUserAccess(call)) {
                    logger.warn("${call.getRequestInfo()} Unauthorized access attempt to CSV Progress dump")
                    throw AuthorizationException("Superuser access required for CSV Progress dump")
                }


                val progressRows = getLatestAnswerMetadata(database)

                val teamIds = progressRows.map { it.teamId }.distinct()


                val teamsByIds = authService.getGroupsOrEmptyList(call, "id in $teamIds").associateBy { it.id }
                val formsbyIds = formService.getFormProviders().associateBy { it.id }

                progressRows.map { row ->
                    AnswerProgressDTO(
                        questionId = row.questionId,
                        answerUpdated = row.answerUpdated,
                        contextId = row.contextId,
                        contextName = row.contextName,
                        formName = formsbyIds[row.formId]?.name ?: row.questionId,
                        teamName = teamsByIds[row.teamId]?.displayName ?: row.teamId,
                    )
                }

                val csv = csvData.toCsv()

                val fileName = "data.csv"
                call.response.header(
                    HttpHeaders.ContentDisposition,
                    ContentDisposition.Attachment.withParameter(ContentDisposition.Parameters.FileName, fileName).toString(),
                )

                logger.info("${call.getRequestInfo()} Successfully generated CSV dump with ${csvData.size} records")
                call.respondBytes(
                    bytes = csv.toByteArray(Charsets.UTF_8),
                    contentType = ContentType.Text.CSV.withCharset(Charsets.UTF_8),
                )
            } catch (e: AuthorizationException) {
                ErrorHandlers.handleAuthorizationException(call, e)
            } catch (e: Exception) {
                logger.error("${call.getRequestInfo()} Error generating CSV dump", e)
                ErrorHandlers.handleGenericException(call, e)
            }
        }
    }
}

fun getLatestAnswersAndComments(database: Database): List<AnswersCSVDump> {
    val sqlStatement = """
        SELECT 
            a.question_id, 
            a.answer, 
            a.answer_type, 
            a.answer_unit, 
            a.updated as answer_updated,
            a.actor as answer_actor,
            a.context_id,
            ctx.name as context_name,
            ctx.table_id as table_id,
            ctx.team_id
        FROM 
            answers a
        JOIN 
            (SELECT question_id, record_id, MAX(updated) as latest 
             FROM answers 
             GROUP BY question_id, record_id, context_id) as latest_answers
            ON a.question_id = latest_answers.question_id 
               AND a.record_id = latest_answers.record_id 
               AND a.updated = latest_answers.latest
        JOIN 
            contexts ctx ON a.context_id = ctx.id
        WHERE 
            a.answer IS NOT NULL AND TRIM(a.answer) != '';
    """.trimIndent()

    return try {
        val resultList = mutableListOf<AnswersCSVDump>()
        database.getConnection().use { conn ->
            conn.prepareStatement(sqlStatement).use { statement ->
                val resultSet = statement.executeQuery()
                while (resultSet.next()) {
                    resultList.add(mapRowToAnswersCSVDump(resultSet))
                }
            }
        }
        logger.debug("Successfully fetched ${resultList.size} records for CSV dump")
        resultList
    } catch (e: SQLException) {
        logger.error("Database error while fetching data for CSV dump", e)
        throw DatabaseException("Failed to fetch data for CSV dump", "getLatestAnswersAndComments", e)
    }
}

fun getLatestAnswerMetadata(database: Database): List<MetaAnswersDB> {
    val sqlStatement = """
        SELECT 
            a.question_id, 
            a.updated as answer_updated,
            a.context_id,
            ctx.name as context_name,
            ctx.table_id as table_id,
            ctx.team_id
        FROM 
            answers a
        JOIN 
            (SELECT question_id, record_id, MAX(updated) as latest 
             FROM answers 
             GROUP BY question_id, record_id, context_id) as latest_answers
            ON a.question_id = latest_answers.question_id 
               AND a.record_id = latest_answers.record_id 
               AND a.updated = latest_answers.latest
        JOIN 
            contexts ctx ON a.context_id = ctx.id
        WHERE 
            a.answer IS NOT NULL AND TRIM(a.answer) != '';
    """.trimIndent()

    return try {
        database.getConnection().use { conn ->
            conn.prepareStatement(sqlStatement).use { statement ->
                val result = statement.executeQuery()
                buildList {
                while (result.next()) {
                    add(MetaAnswersDB(    questionId = result.getString("question_id"),
                        answerUpdated = result.getDate("answer_updated"),
                        contextId = result.getString("context_id"),
                        contextName = result.getString("context_name"),
                        formId = result.getString("table_id"),
                        teamId = result.getString("team_id"),))
                }
                }
            }
        }.also{logger.debug("Successfully fetched ${it.size} records for CSV dump")}
    } catch (e: SQLException) {
        logger.error("Database error while fetching data for CSV dump", e)
        throw DatabaseException("Failed to fetch data for CSV dump", "getLatestAnswersAndComments", e)
    }
}

fun List<AnswersCSVDump>.toCsv(): String {
    val stringWriter = StringWriter()
    stringWriter.append("questionId,answer,answer_type,answer_unit,answer_updated,answer_actor,context_id,context_name,table_id,team_id\n")
    this.forEach {
        stringWriter.append("\"${it.questionId}\",\"${it.answer}\",\"${it.answerType}\",\"${it.answerUnit}\",\"${it.answerUpdated}\",\"${it.answerActor}\",\"${it.contextId}\",\"${it.contextName}\",\"${it.tableName}\",\"${it.teamId}\"\n")
    }

    return stringWriter.toString()
}

fun List<AnswerProgressDTO>.toCsv(): String {
    val stringWriter = StringWriter()
    stringWriter.append("questionId,answer_updated,context_id,context_name,form_name,team_name\n")
    this.forEach {
        stringWriter.append("\"${it.questionId}\",\"${it.answerUpdated}\",\"${it.contextId}\",\"${it.contextName}\",\"${it.formName}\",\"${it.teamName}\"\n")
    }

    return stringWriter.toString()
}

fun mapRowToAnswersCSVDump(rs: ResultSet): AnswersCSVDump = AnswersCSVDump(
    questionId = rs.getString("question_id"),
    answer = rs.getString("answer"),
    answerType = rs.getString("answer_type"),
    answerUnit = rs.getString("answer_unit"),
    answerUpdated = rs.getDate("answer_updated"),
    answerActor = rs.getString("answer_actor"),
    contextId = rs.getString("context_id"),
    tableName = rs.getString("table_id"),
    teamId = rs.getString("team_id"),
    contextName = authService.getUserByUserId(rs.getString("context_name")),
)



data class AnswersCSVDump(
    val questionId: String,
    val answer: String,
    val answerType: String,
    val answerUnit: String?,
    val answerUpdated: Date,
    val answerActor: String,
    val contextId: String,
    val tableName: String,
    val teamId: String,
    val contextName: String,
)

data class AnswerProgressDTO(
    val questionId: String,
    val answerUpdated: Date,
    val contextId: String,
    val contextName: String,
    val formName: String,
    val teamName: String,
)

data class MetaAnswersDB(
    val questionId: String,
    val answerUpdated: Date,
    val contextId: String,
    val contextName: String,
    val formId: String,
    val teamId: String,
)

