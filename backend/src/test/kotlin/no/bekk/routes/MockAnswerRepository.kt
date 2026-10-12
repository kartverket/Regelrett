package no.bekk.routes

import no.bekk.database.*

interface MockAnswerRepository : AnswerRepository {
    override fun getLatestAnswersByContextIdFromDatabase(contextId: String): List<DatabaseAnswer> {
        TODO("Not yet implemented")
    }

    override fun insertAnswerOnContext(answer: DatabaseAnswerRequest): DatabaseAnswer {
        TODO("Not yet implemented")
    }

    override fun copyAnswersFromOtherContext(newContextId: String, contextToCopy: String) {
        TODO("Not yet implemented")
    }

    override fun getAnswersByContextAndRecordIdFromDatabase(contextId: String, recordId: String): List<DatabaseAnswer> {
        TODO("Not yet implemented")
    }

    override fun insertAnswersOnContextBatch(answers: List<DatabaseAnswerRequest>): List<DatabaseAnswer> {
        TODO("Not yet implemented")
    }
}
