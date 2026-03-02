package no.bekk.routes

import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import no.bekk.exception.NotFoundException
import no.bekk.exception.ValidationException
import no.bekk.plugins.ErrorHandlers
import no.bekk.services.FormService
import no.bekk.services.FormsMetadataDto
import no.bekk.util.RequestContext.getRequestInfo
import org.slf4j.LoggerFactory

fun Route.formRouting(formService: FormService) {
    val logger = LoggerFactory.getLogger("no.bekk.routes.FormRouting")
    route("/forms") {
        get {
            try {
                logger.info("${call.getRequestInfo()} Received GET /forms")
                val forms = formService.getFormProviders().map {
                    it.getForm().let { FormsMetadataDto(it.id, it.name) }
                }
                logger.info("${call.getRequestInfo()} Successfully retrieved ${forms.size} forms")
                call.respond(HttpStatusCode.OK, forms)
            } catch (e: Exception) {
                logger.error("${call.getRequestInfo()} Error retrieving forms", e)
                ErrorHandlers.handleGenericException(call, e)
            }
        }

        get("/{formId}") {
            try {
                val formId = call.parameters["formId"]
                logger.info("${call.getRequestInfo()} Received GET /forms with id $formId")

                if (formId == null) {
                    logger.warn("${call.getRequestInfo()} Missing formId parameter")
                    throw ValidationException("formId parameter is required", field = "formId")
                }

                val table = formService.getFormProvider(formId).getForm()
                logger.info("${call.getRequestInfo()} Form found: $formId")
                call.respond(HttpStatusCode.OK, table)
            } catch (e: ValidationException) {
                ErrorHandlers.handleValidationException(call, e)
            } catch (e: IllegalArgumentException) {
                logger.error("${call.getRequestInfo()} Form not found: ${call.parameters["formId"]}", e)
                ErrorHandlers.handleNotFoundException(call, NotFoundException("Form not found"))
            } catch (e: Exception) {
                logger.error("${call.getRequestInfo()} Error retrieving form", e)
                ErrorHandlers.handleGenericException(call, e)
            }
        }
        get("/{formId}/{recordId}") {
            try {
                val formId = call.parameters["formId"]
                val recordId = call.parameters["recordId"]
                logger.info("${call.getRequestInfo()} Received GET /forms with id $formId and recordId $recordId")

                if (formId == null) {
                    logger.warn("${call.getRequestInfo()} Missing formId parameter")
                    throw ValidationException("formId parameter is required", field = "formId")
                }

                if (recordId == null) {
                    logger.warn("${call.getRequestInfo()} Missing recordId parameter")
                    throw ValidationException("recordId parameter is required", field = "recordId")
                }

                val question = formService.getFormProvider(formId).getQuestion(recordId)
                logger.info("${call.getRequestInfo()} Successfully retrieved question: $question")
                call.respond(HttpStatusCode.OK, question)
            } catch (e: ValidationException) {
                ErrorHandlers.handleValidationException(call, e)
            } catch (e: NotFoundException) {
                logger.error("${call.getRequestInfo()} Question not found for recordId: ${call.parameters["recordId"]}", e)
                ErrorHandlers.handleNotFoundException(call, e)
            } catch (e: Exception) {
                logger.error("${call.getRequestInfo()} Error retrieving question for recordId: ${call.parameters["recordId"]}", e)
                ErrorHandlers.handleGenericException(call, e)
            }
        }
        get("/{formId}/columns") {
            try {
                val formId = call.parameters["formId"]
                logger.info("${call.getRequestInfo()} Received GET /forms/formId/columns with id $formId")

                if (formId == null) {
                    logger.warn("${call.getRequestInfo()} Missing formId parameter")
                    throw ValidationException("formId parameter is required", field = "formId")
                }

                val columns = formService.getFormProvider(formId).getColumns()
                logger.info("${call.getRequestInfo()} Successfully retrieved columns: $columns")
                call.respond(HttpStatusCode.OK, columns)
            } catch (e: ValidationException) {
                ErrorHandlers.handleValidationException(call, e)
            } catch (e: Exception) {
                logger.error("${call.getRequestInfo()} Error retrieving columns from form: ${call.parameters["formId"]}", e)
                ErrorHandlers.handleGenericException(call, e)
            }
        }
    }
}
