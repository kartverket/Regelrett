package no.bekk.routes

import no.bekk.database.CommentRepository
import no.bekk.database.DatabaseComment
import no.bekk.database.DatabaseCommentRequest

interface MockCommentRepository : CommentRepository {
    override fun getCommentsByContextIdFromDatabase(contextId: String): List<DatabaseComment> {
        TODO("Not yet implemented")
    }

    override fun insertCommentOnContext(comment: DatabaseCommentRequest): DatabaseComment {
        TODO("Not yet implemented")
    }

    override fun deleteCommentFromDatabase(contextId: String, recordId: String): Boolean {
        TODO("Not yet implemented")
    }

    override fun getCommentsByContextAndRecordIdFromDatabase(
        contextId: String,
        recordId: String,
    ): List<DatabaseComment> {
        TODO("Not yet implemented")
    }

    override fun copyCommentsFromOtherContext(newContextId: String, contextToCopy: String) {
        TODO("Not yet implemented")
    }

    override fun insertCommentsOnContextBatch(comments: List<DatabaseCommentRequest>): List<DatabaseComment> {
        TODO("Not yet implemented")
    }
}
